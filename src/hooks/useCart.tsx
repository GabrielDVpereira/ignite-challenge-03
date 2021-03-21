import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });
  const addProduct = async (productId: number) => {
    try {
      const productToAdd = cart.filter(
        (procuct) => procuct.id === productId
      )[0];

      if (productToAdd !== undefined) {
        updateProductAmount({ productId, amount: productToAdd.amount + 1 });
      } else {
        const productResponse = await api.get(`/products/${productId}`);
        const product = productResponse.data;

        const newCart = [...cart, { ...product, amount: 1 }];
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
        setCart(newCart);
      }
    } catch (error) {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const hasProuct = cart.filter((product) => product.id === productId)
        .length;
      if (!hasProuct) throw new Error("Erro na remoção do produto");
      const newCart = cart.filter((product) => product.id !== productId);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
      setCart(newCart);
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) return;
      const hasProuct = cart.filter((product) => product.id === productId)
        .length;
      if (!hasProuct)
        throw new Error("Erro na alteração de quantidade do produto");
      const productStockResponse = await api.get<Stock>(`/stock/${productId}`);
      const productStock = productStockResponse.data;

      if (productStock.amount < amount)
        throw new Error("Quantidade solicitada fora de estoque");

      const newCart = cart.map((product) => {
        if (product.id === productId) {
          product.amount = amount;
        }

        return product;
      });
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
      setCart(newCart);
    } catch (error) {
      toast.error(
        error.message || "Erro na alteração de quantidade do produto"
      );
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
