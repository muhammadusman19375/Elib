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
        folder: "book-covers",
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

const updateBook = async(req: Request, res: Response, next: NextFunction) => {
    const {title, genre} = req.body;
    const bookId = req.params.bookId;

    const book = await bookModel.findOne({_id: bookId});
    if(!book) {
        return next(createHttpError(404, "Book not found."));
    }

    // check this book belongs to that author.
    const _req = req as AuthRequest;
    if(book.author.toString() !== _req.userId) {
        return next(createHttpError(403, "You cannot update others book."));
    }

    // check if the image field exists.
    const files = req.files as {[fieldname: string]: Express.Multer.File[]};
    let completeCoverImage = "";
    if(files.coverImage) {
        const filename = files.coverImage[0].filename;
        const coverImageMimeType = files.coverImage[0].mimetype.split('/').at(-1);

        // send file to cloudinary
        const filePath = path.resolve(
            __dirname,
            "../../public/data/uploads",
            filename
        );

        completeCoverImage = filename;

        try {
            const uploadResult = await cloudinary.uploader.upload(filePath, {
            filename_override: filename,
            folder: "book-covers",
            format: coverImageMimeType
        });

        completeCoverImage = uploadResult.secure_url;
        await fs.promises.unlink(filePath);
        } catch (err) {
            return next(createHttpError(500, "Error while updating cover image."));
        }
    }

    // check if the file field exist
    let completeFileName = "";
    if(files.file) {
        const bookFileName = files.file[0].filename;

        const bookFilePath = path.resolve(
            __dirname,
            "../../public/data/uploads",
            bookFileName
        );

        completeFileName = bookFileName;

        try {
            const uplaodResultPdf = await cloudinary.uploader.upload(bookFilePath, {
            resource_type: "raw",
            filename_override: completeFileName,
            folder: "book-pdfs",
            format: "pdf"
        });

        completeFileName = uplaodResultPdf.secure_url;
        await fs.promises.unlink(bookFilePath)
        } catch(err) {
            return next(createHttpError(500, "Error while updating file."))
        }
    }

    // update book model with updated data
    const updatedBook = await bookModel.findOneAndUpdate(
        {
            _id: bookId
        },
        {
            title: title,
            genre: genre,
            coverImage: completeCoverImage ? completeCoverImage : book.coverImage,
            file: completeFileName ? completeFileName: book.file
        },
        {new: true}
    );

    res.json(updatedBook)
}

const listBooks = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const book = await bookModel.find();
        res.json(book);
    } catch(err) {
        return next(createHttpError(500, "Error while getting a book"));
    }
};

export {createBook, updateBook, listBooks};
