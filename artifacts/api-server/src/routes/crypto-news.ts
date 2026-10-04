import { Router, type IRouter } from "express";
import { ListCryptoNewsResponse } from "@workspace/api-zod";

const router: IRouter = Router();
const feeds = [
  { label: "CoinDesk", url: "https://www.coindesk.com/arc/outboundfeeds/rss/" },
  { label: "Cointelegraph", url: "https://cointelegraph.com/rss" },
];

type Story = {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: string;
};

let cachedStories: Story[] | undefined;
let cacheExpiresAt = 0;
let pendingFetch: Promise<Story[]> | undefined;
const CACHE_DURATION_MS = 3 * 60 * 1000;

function decodeXml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_match, hex: string) =>
      String.fromCharCode(Number.parseInt(hex, 16)),
    )
    .replace(/&#([0-9]+);/g, (_match, decimal: string) =>
      String.fromCharCode(Number.parseInt(decimal, 10)),
    )
    .replace(/\s+/g, " ")
    .trim();
}

function readTag(item: string, name: string): string {
  const match = item.match(
    new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, "i"),
  );
  return match?.[1] ? decodeXml(match[1]) : "";
}

async function readFeed(feed: (typeof feeds)[number]): Promise<Story[]> {
  const response = await fetch(feed.url, { signal: AbortSignal.timeout(10_000) });
  if (!response.ok) {
    throw new Error(`${feed.label} returned HTTP ${response.status}.`);
  }
  const xml = await response.text();
  const items = [...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)];
  return items
    .map((match, index) => {
      const body = match[1] ?? "";
      const url = readTag(body, "link") || readTag(body, "guid");
      return {
        id: `${feed.label}-${url || index}`,
        title: readTag(body, "title"),
        summary: readTag(body, "description"),
        url,
        source: feed.label,
        publishedAt: readTag(body, "pubDate"),
      };
    })
    .filter((story) => story.title && /^https?:\/\//i.test(story.url));
}

async function loadStories(): Promise<Story[]> {
  const outcomes = await Promise.allSettled(feeds.map(readFeed));
  const stories = outcomes.flatMap((outcome) =>
    outcome.status === "fulfilled" ? outcome.value : [],
  );
  const uniqueStories = [...new Map(stories.map((story) => [story.url, story])).values()];
  if (uniqueStories.length === 0) {
    const failures = outcomes
      .filter((outcome): outcome is PromiseRejectedResult => outcome.status === "rejected")
      .map((outcome) => String(outcome.reason));
    throw new Error(`All trusted news feeds failed: ${failures.join("; ")}`);
  }
  return uniqueStories
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
    .slice(0, 40);
}

function getStories(): Promise<Story[]> {
  if (cachedStories && cacheExpiresAt > Date.now()) return Promise.resolve(cachedStories);
  if (pendingFetch) return pendingFetch;
  pendingFetch = loadStories()
    .then((stories) => {
      cachedStories = ListCryptoNewsResponse.parse(stories) as Story[];
      cacheExpiresAt = Date.now() + CACHE_DURATION_MS;
      return cachedStories;
    })
    .finally(() => {
      pendingFetch = undefined;
    });
  return pendingFetch;
}

router.get("/crypto/news", async (req, res): Promise<void> => {
  try {
    const stories = await getStories();
    res.setHeader("Cache-Control", "public, max-age=180, stale-while-revalidate=300");
    res.json(ListCryptoNewsResponse.parse(stories));
  } catch (error) {
    req.log.warn({ err: error }, "Trusted crypto news feeds are unavailable");
    if (cachedStories?.length) {
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("X-News-Stale", "true");
      res.json(ListCryptoNewsResponse.parse(cachedStories));
      return;
    }
    res.status(502).json({ error: "Trusted crypto news feeds are temporarily unavailable." });
  }
});

export default router;