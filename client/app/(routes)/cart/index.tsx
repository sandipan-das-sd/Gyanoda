// import CartScreen from "@/screens/cart/cart.screen";
// import { StripeProvider } from "@stripe/stripe-react-native";

// export default function index() {
//   return (
//     <StripeProvider
//       publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!}
//     >
//       <CartScreen />
//     </StripeProvider>
//   );
// }

import CartScreen from "@/screens/cart/cart.screen";

export default function Index() {
  return <CartScreen />;
}
