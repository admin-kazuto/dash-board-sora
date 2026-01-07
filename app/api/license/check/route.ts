import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import License from '@/models/License';

export async function POST(req: Request) {
    try {
        await dbConnect();
        const { license_key, device_id } = await req.json();

        if (!license_key || !device_id) {
            return NextResponse.json({ success: false, error: 'Missing key or device_id' }, { status: 400 });
        }

        const license = await License.findOne({ key: license_key });

        if (!license) {
            // Return 200 with invalid status for client compatibility
            return NextResponse.json({ success: false, status: 'invalid', detail: 'License key not found' });
        }

        if (!license.is_active) {
            return NextResponse.json({ success: false, status: 'invalid', detail: 'License is inactive' });
        }

        if (new Date() > license.valid_until) {
            return NextResponse.json({ success: false, status: 'invalid', detail: 'License expired' });
        }

        // Device check
        if (!license.devices.includes(device_id)) {
            if (license.devices.length >= license.max_devices) {
                return NextResponse.json({ success: false, status: 'invalid', detail: 'Max devices reached' });
            }
            // Add device
            license.devices.push(device_id);
            await license.save();
        }

        return NextResponse.json({ success: true, status: 'valid' });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
