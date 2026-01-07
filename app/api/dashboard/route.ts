import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import License from '@/models/License';
import Video from '@/models/Video';

export async function GET() {
    try {
        await dbConnect();

        const totalLicenses = await License.countDocuments();
        const activeLicenses = await License.countDocuments({
            is_active: true,
            valid_until: { $gt: new Date() }
        });

        const totalVideos = await Video.countDocuments();
        const successVideos = await Video.countDocuments({ status: 'success' });
        const successRate = totalVideos > 0 ? Math.round((successVideos / totalVideos) * 100) : 0;

        return NextResponse.json({
            success: true,
            stats: {
                total_licenses: totalLicenses,
                active_licenses: activeLicenses,
                total_videos: totalVideos,
                success_rate: successRate
            }
        });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
