import mongoose from "mongoose"
import bcrypt from "bcryptjs"

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
        select: false
    }
}, { timestamps: true });

userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    if (bcrypt.truncates(this.password)) {
        const error = new mongoose.Error.ValidationError(this);
        error.addError(
            "password",
            new mongoose.Error.ValidatorError({
                path: "password",
                message: "Password must not exceed 72 bytes",
                value: this.password
            })
        );
        throw error;
    }

    this.password = await bcrypt.hash(this.password, 10);
});

const User = mongoose.model("User", userSchema);

export default User;