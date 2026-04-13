import { Router, type IRouter } from "express";
import healthRouter from "./health";
import stooqRouter from "./stooq";

const router: IRouter = Router();

router.use(healthRouter);
router.use(stooqRouter);

export default router;
