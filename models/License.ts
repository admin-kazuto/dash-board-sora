import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILicense extends Document {
    key: string;
    description: string;
    max_devices: number;
    devices: string[];
    valid_until: Date;
    is_active: boolean;
    tools: number[]; // Array of tool IDs: 1=T2V, 2=T2I, 3=I2V, 4=Start-End, 5=CharSync
    created_at: Date;
}

const LicenseSchema: Schema = new Schema({
    key: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    max_devices: { type: Number, default: 1 },
    devices: { type: [String], default: [] },
    valid_until: { type: Date, required: true },
    is_active: { type: Boolean, default: true },
    tools: { type: [Number], required: true, default: [1, 2, 3, 4, 5, 6] }, // Default: all tools
    created_at: { type: Date, default: Date.now },
});

// Check if model already exists to avoid Compiling Schema Error in dev
const License: Model<ILicense> = mongoose.models.License || mongoose.model<ILicense>('License', LicenseSchema);

export default License;
