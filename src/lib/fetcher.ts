export const fetcher = async (url: string) => {
  const token = localStorage.getItem("authToken");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, { headers });

  if (!res.ok) {
    let errorInfo;
    try {
      errorInfo = await res.json();
    } catch {
      errorInfo = { message: res.statusText };
    }
    // Cria um objeto de erro customizado com o status e info
    const customError: Error & { info?: unknown; status?: number } = new Error(
      errorInfo.message || "An error occurred while fetching the data."
    );
    customError.info = errorInfo;
    customError.status = res.status;
    throw customError;
  }

  return res.json();
};