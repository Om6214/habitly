// src/users/users.service.ts

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CreateUserInput } from './dto/create-user.input';
import * as bcrypt from 'bcrypt';
import { LoginUserInput } from './dto/login-user.input';
import { LoginResponse } from './dto/login-response.type';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserModel } from './models/user.model';

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) { }

    // Create User
    async create(input: CreateUserInput): Promise<UserModel> {
        const { username, email, password } = input;

        const existingUser = await this.userModel.findOne({ email }).exec();
        if (existingUser) {
            throw new BadRequestException('Email already exists');
        }


        const newUser = new this.userModel({
            username,
            email,
            password,
        });

        const savedUser = await newUser.save();
        const obj: any = savedUser.toObject();
        // map _id -> id to match UserModel
        obj.id = obj._id?.toString();
        delete obj._id;
        delete obj.password;
        delete obj.__v;

        return obj as UserModel;
    }


    async login(loginDto: LoginUserInput): Promise<LoginResponse> {
        const { email, password } = loginDto;

        const user = await this.userModel.findOne({ email }).select('+password').exec();
        if (!user) throw new NotFoundException('User not found');

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) throw new BadRequestException('Invalid credentials');

        const payload = { sub: user._id.toString(), email: user.email };

        const accessTokenExpiry = this.configService.get<string>('JWT_EXPIRATION') || '15m';
        const refreshTokenExpiry = this.configService.get<string>('REFRESH_TOKEN_EXPIRATION') || '7d';

        const accessToken = await this.jwtService.signAsync(payload);
        const refreshToken = await this.jwtService.signAsync({ sub: user._id.toString() });


        try {
            const hashedRefresh = await bcrypt.hash(refreshToken, 10);
            await this.userModel.findByIdAndUpdate(user._id, { $set: { currentHashedRefreshToken: hashedRefresh } }).exec();
        } catch (err) {
            console.warn('Could not save hashed refresh token:', err);
        }

        const userSafe: any = user.toObject();
        userSafe.id = userSafe._id?.toString();
        delete userSafe._id;
        delete userSafe.password;
        delete userSafe.currentHashedRefreshToken;
        delete userSafe.__v;

        const response: any = { accessToken, refreshToken, user: userSafe };
        return response as LoginResponse;
    }


    // Get all users
    async findAll(): Promise<UserModel[]> {
        const docs = await this.userModel.find().exec();
        return docs.map((d: any) => {
            const obj = d.toObject();
            obj.id = obj._id?.toString();
            delete obj._id;
            delete obj.password;
            delete obj.__v;
            return obj as UserModel;
        });
    }

    // Get user by ID
    async findById(id: string): Promise<UserModel> {
        const user = await this.userModel.findById(id).exec();
        if (!user) throw new NotFoundException('User not found');
        const obj: any = user.toObject();
        obj.id = obj._id?.toString();
        delete obj._id;
        delete obj.password;
        delete obj.__v;
        return obj as UserModel;
    }

    // Find user by email (used by other services)
    async findByEmail(email: string, selectPassword = false): Promise<UserDocument | null> {
        if (selectPassword) {
            return this.userModel.findOne({ email }).select('+password').exec();
        }
        return this.userModel.findOne({ email }).exec();
    }

    // Update user
    async update(id: string, data: Partial<User>): Promise<UserModel> {
        const dataToUpdate: any = { ...data };
        if (dataToUpdate.password) {
            const saltRounds = 10;
            dataToUpdate.password = await bcrypt.hash(dataToUpdate.password, saltRounds);
        }

        const user = await this.userModel.findByIdAndUpdate(id, dataToUpdate, { new: true }).exec();
        if (!user) throw new NotFoundException('User not found');

        const obj: any = user.toObject();
        obj.id = obj._id?.toString();
        delete obj._id;
        delete obj.password;
        delete obj.__v;
        return obj as UserModel;
    }

    // Delete user
    async delete(id: string): Promise<boolean> {
        const result = await this.userModel.findByIdAndDelete(id).exec();
        return result ? true : false;
    }
}
