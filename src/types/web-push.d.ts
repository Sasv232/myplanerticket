declare module "web-push" {
  interface PushSubscription {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  }

  interface VapidDetails {
    subject: string;
    publicKey: string;
    privateKey: string;
  }

  interface SendResult {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
  }

  function setVapidDetails(subject: string, publicKey: string, privateKey: string): void;
  function sendNotification(
    subscription: PushSubscription,
    payload: string | Buffer,
    options?: Record<string, any>
  ): Promise<SendResult>;
  function generateVapidKeys(): { publicKey: string; privateKey: string };

  export { setVapidDetails, sendNotification, generateVapidKeys };
  export default { setVapidDetails, sendNotification, generateVapidKeys };
}
