import { useCallback } from "react";

const API_URL = import.meta.env.VITE_API_URL || "";

export function useStripe() {
  const createCheckoutSession = useCallback(
    async (userId: string, credits: number) => {
      try {
        const response = await fetch(`${API_URL}/api/payments/checkout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ credits }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Errore creazione sessione di pagamento");
        }

        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error("Stripe non ha restituito un URL di checkout");
        }
      } catch (error) {
        console.error("Errore creazione sessione Stripe:", error);
        throw error;
      }
    },
    []
  );

  const verifyPayment = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/payments/verify/${sessionId}`, {
        credentials: "include",
      });
      return await response.json();
    } catch (error) {
      console.error("Errore verifica pagamento:", error);
      return null;
    }
  }, []);

  const handlePaymentCallback = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("payment");
    const sessionId = params.get("session_id");

    if (status === "success" && sessionId) {
      return { success: true, sessionId };
    } else if (status === "cancel") {
      return { success: false, message: "Pagamento annullato" };
    }

    return null;
  }, []);

  return {
    createCheckoutSession,
    verifyPayment,
    handlePaymentCallback,
  };
}
