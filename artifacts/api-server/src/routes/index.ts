import { Router, type IRouter } from "express";
import healthRouter from "./health";
import publicRouter from "./public";
import jiotvRouter from "./jiotv";

const router: IRouter = Router();

router.use(healthRouter);
router.use(publicRouter);
router.use(jiotvRouter);

export default router;
