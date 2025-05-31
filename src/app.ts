import express from 'express'
import createHttpError from 'http-errors';
import globalErrorHandler from './middlewares/globalErrorHandler';

const app = express();

app.get('/', (req, res, next) => {
    res.json({message: "Welcome to ebook apis."});
});

// Global error handler
app.use(globalErrorHandler);

export default app;