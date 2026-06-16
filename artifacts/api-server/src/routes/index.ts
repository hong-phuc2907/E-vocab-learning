import { Router, type IRouter } from "express";
import healthRouter from "./health";
import wordsRouter from "./words";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(wordsRouter);
router.use(statsRouter);

export default router;
