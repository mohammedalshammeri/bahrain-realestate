// AFS Payment Gateway Integration
import axios from "axios";

interface AfsPaymentRequest {
  amount: number;
  currency: string;
  merchantId: string;
  orderId: string;
  returnUrl: string;
  callbackUrl: string;
}

interface AfsPaymentResponse {
  sessionId: string;
  redirectUrl: string;
  status: string;
  message?: string;
}

export const createAfsPaymentSession = async (
  amount: number,
  transactionId: number
): Promise<AfsPaymentResponse> => {
  try {
    const afsApiUrl = "https://sandbox-ipg.afs.com.kw/acquire/multipayment/initiate";
    
    // Validate required environment variables
    if (!process.env.AFS_API_KEY) {
      throw new Error("AFS_API_KEY environment variable is required");
    }
    
    if (!process.env.AFS_MERCHANT_ID) {
      throw new Error("AFS_MERCHANT_ID environment variable is required");
    }
    
    if (!process.env.AFS_RETURN_URL) {
      throw new Error("AFS_RETURN_URL environment variable is required");
    }
    
    if (!process.env.AFS_CALLBACK_URL) {
      throw new Error("AFS_CALLBACK_URL environment variable is required");
    }

    // Prepare request payload
    const requestPayload: AfsPaymentRequest = {
      amount,
      currency: "BHD",
      merchantId: process.env.AFS_MERCHANT_ID,
      orderId: `TX-${transactionId}`,
      returnUrl: process.env.AFS_RETURN_URL,
      callbackUrl: process.env.AFS_CALLBACK_URL,
    };

    // Make API call to AFS
    const response = await axios.post(afsApiUrl, requestPayload, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.AFS_API_KEY}`,
      },
      timeout: 30000, // 30 seconds timeout
    });

    // Extract response data
    const { sessionId, redirectUrl, status, message } = response.data;

    if (!sessionId || !redirectUrl) {
      throw new Error("Invalid response from AFS API: Missing sessionId or redirectUrl");
    }

    return {
      sessionId,
      redirectUrl,
      status: status || "initiated",
      message,
    };
  } catch (error) {
    // Handle axios errors
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      const errorMessage = error.response?.data?.message || error.message;
      
      throw new Error(
        `AFS API Error (${statusCode}): ${errorMessage}`
      );
    }

    // Handle other errors
    throw new Error(`AFS Integration Error: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
};
