import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const ensureDefaultUser = async () => {
    try {
        const email = 'limmiinning@gmail.com';
        const password = 'password123';
        const name = 'Default User';
        
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (!existingUser) {
            console.log(`[BOOTSTRAP] 👤 Creating default user: ${email}`);
            
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            await prisma.user.create({
                data: {
                    email,
                    name,
                    passwordHash: hashedPassword,
                    role: UserRole.OWNER,
                    emailVerified: true
                }
            });
            console.log(`[BOOTSTRAP] ✅ Default user created successfully.`);
        } else {
             console.log(`[BOOTSTRAP] ℹ️ Default user ${email} already exists.`);
        }

    } catch (error) {
        console.error('[BOOTSTRAP] ❌ Failed to ensure default user:', error);
    }
};
