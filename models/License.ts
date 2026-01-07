import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILicense extends Document {
    key: string;
    description: string;
    max_devices: number;
    devices: string[];
    valid_until: Date;
    is_active: boolean;
    tool_id: number; // 1: Veo, 2: Sora
    created_at: Date;
}

const LicenseSchema: Schema = new Schema({
    key: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    max_devices: { type: Number, default: 1 },
    devices: { type: [String], default: [] },
    valid_until: { type: Date, required: true },
    is_active: { type: Boolean, default: true },
    tool_id: { type: Number, required: true, default: 2 },
    created_at: { type: Date, default: Date.now },
});

// Check if model already exists to avoid Compiling Schema Error in dev
const License: Model<ILicense> = mongoose.models.License || mongoose.model<ILicense>('License', LicenseSchema);

export default License;
