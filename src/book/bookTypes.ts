import { User } from "../user/userTypes";

export interface Book {
    _id: String;
    title: String;
    author: User;
    genre: String;
    coverImage: String;
    file: String;
    createdAt: Date;
    updatedAt: Date
}