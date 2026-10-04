import { Router, type IRouter } from "express";
import cryptoNewsRouter from "./crypto-news";
import healthRouter from "./health";

const router: IRouter = Router();

router.use(healthRouter);
router.use(cryptoNewsRouter);

export default router;
