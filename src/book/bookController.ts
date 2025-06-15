import path from 'node:path';
import fs from 'node:fs';
import { NextFunction, Request, Response } from "express";
import cloudinary from "../config/cloudinary";
import createHttpError from 'http-errors';
import bookModel from './bookModel';
import { AuthRequest } from '../middlewares/authenticate';


const createBook = async(req: Request, res: Response, next: NextFunction) => {

    const {title, genre} = req.body;
    
    const files = req.files as {[fieldname: string]: Express.Multer.File[]};

    // First store file local
    const coverImageMimeType = files.coverImage[0].mimetype.split('/').at(-1);
    const fileName = files.coverImage[0].filename;
    const filePath = path.resolve(__dirname, '../../public/data/uploads', fileName);

    const bookFileName = files.file[0].filename;
    const bookFilePath = path.resolve(__dirname, '../../public/data/uploads', bookFileName);

    // Second upload file local to online server
    try {
    const uploadResult = await cloudinary.uploader.upload(filePath, {
        filename_override: fileName,
        folder: "book_covers",
        format: coverImageMimeType
    });

    const bookFileUploadResult = await cloudinary.uploader.upload(bookFilePath, {
        resource_type: "raw",
        filename_override: bookFileName,
        folder: "book-pdfs",
        format: "pdf"
    });

    const _req = req as AuthRequest

    const newBook = await bookModel.create({
        title,
        genre,
        author: _req.userId,
        coverImage: uploadResult.secure_url,
        file: bookFileUploadResult.secure_url
    });

    // Third delete file from local
    try {
        await fs.promises.unlink(filePath);
        await fs.promises.unlink(bookFilePath);
    } catch(err) {
        console.log(err)
        return next(createHttpError(500, 'Error while deleting files from local.'))
    }

    res.status(201).json({id: newBook._id});
    } catch(err) {
        console.log(err)
        return next(createHttpError(500, 'Error while uploading files.'));
    }
};

export {createBook};