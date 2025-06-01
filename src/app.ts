import express from 'express'
import createHttpError from 'http-errors';
import globalErrorHandler from './middlewares/globalErrorHandler';
import userRouter from './user/userRouter';

const app = express();
app.use(express.json());

app.get('/', (req, res, next) => {
    res.json({message: "Welcome to ebook apis."});
});

app.use("/api/users", userRouter);

// Global error handler
app.use(globalErrorHandler);

export default app;