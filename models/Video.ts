import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IVideo extends Document {
    video_id: string;
    location: string; // share_url or path
    prompt: string;
    duration: number;
    orientation: string;
    status: string;
    license_key: string;
    created_at: Date;
}

const VideoSchema: Schema = new Schema({
    video_id: { type: String, required: true, unique: true },
    location: { type: String, required: true },
    prompt: { type: String },
    duration: { type: Number },
    orientation: { type: String },
    status: { type: String, default: 'pending' },
    license_key: { type: String, index: true },
    created_at: { type: Date, default: Date.now },
});

const Video: Model<IVideo> = mongoose.models.Video || mongoose.model<IVideo>('Video', VideoSchema);

export default Video;
