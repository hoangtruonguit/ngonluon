import * as amqp from 'amqplib';
import * as fs from 'fs';
import { join } from 'path';

// Manual .env parsing to avoid dependency issues
const envPath = join(__dirname, '.env');
const envConfig = fs.existsSync(envPath) 
    ? fs.readFileSync(envPath, 'utf8')
        .split('\n')
        .reduce((acc, line) => {
            const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
            if (match) {
                let value = match[2] || '';
                if (value.length > 0 && value.startsWith('"') && value.endsWith('"')) {
                    value = value.substring(1, value.length - 1);
                }
                acc[match[1]] = value;
            }
            return acc;
        }, {} as Record<string, string>)
    : {};

const RABBITMQ_URL = envConfig['RABBITMQ_URL'] || 'amqp://guest:guest@localhost:5672';
const EXCHANGE = 'app.exchange';

async function sendTestEmail() {
    console.log('🚀 Connecting to RabbitMQ...');
    let connection;
    try {
        connection = await amqp.connect(RABBITMQ_URL);
        const channel = await connection.createChannel();

        await channel.assertExchange(EXCHANGE, 'topic', { durable: true });

        const testEmails = [
            {
                routingKey: 'email.welcome',
                payload: {
                    to: 'test-user@example.com',
                    subject: 'Chào mừng bạn đến với NgonLuon',
                    template: 'welcome-email',
                    data: { fullName: 'Người Dùng Thử' }
                }
            },
            {
                routingKey: 'email.reset_password',
                payload: {
                    to: 'test-reset@example.com',
                    subject: 'Yêu cầu đặt lại mật khẩu',
                    template: 'reset_password',
                    data: { resetUrl: 'https://ngonluon.com/reset-password?token=123456' }
                }
            }
        ];

        for (const item of testEmails) {
            const content = Buffer.from(JSON.stringify(item.payload));
            channel.publish(EXCHANGE, item.routingKey, content, {
                persistent: true,
                contentType: 'application/json',
                headers: { 'x-retry-count': 0 }
            });
            console.log(`✅ Message sent to routing key: ${item.routingKey}`);
        }

        console.log('Done! Closing connection...');
        await channel.close();
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        if (connection) await connection.close();
    }
}

sendTestEmail();
