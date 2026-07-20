import AppInterno from "./AppInterno";
import AppPlataforma from "./AppPlataforma";

const surface = (import.meta.env.VITE_SURFACE || "plataforma").toLowerCase();

export default function App() {
  if (surface === "interno") {
    return <AppInterno />;
  }
  return <AppPlataforma />;
}
