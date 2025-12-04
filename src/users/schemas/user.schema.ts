import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import * as bcrypt from 'bcrypt';

export type UserDocument = HydratedDocument<User>

@Schema({ timestamps: true })
export class User {
    @Prop({ required: true, unique: true, trim: true })
    username: string;

    @Prop({ required: true, unique: true, trim: true, lowercase: true })
    email: string;

    @Prop({ required: true, select: false })
    password: string;

    @Prop({ default: true })
    isActive: boolean;

}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre<UserDocument>('save', async function (next) {
    const user = this;
    if (!user.isModified('password')) return next();

    try {
        const salt = bcrypt.genSaltSync(10);
        user.password = bcrypt.hashSync(user.password, salt);
        return next();
    } catch (err) {
        return next(err as Error);
    }
})

UserSchema.methods.comparePassword = async function (
    candidatePassword: string,
): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

if (!UserSchema.get('toJSON')) {
    UserSchema.set('toJSON', {
        transform(doc: any, ret: any) {
            delete ret.password;
            delete ret.currentHashedRefreshToken;
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
        },
    });
}