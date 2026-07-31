import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { MiCuentaPage } from "./pages/MiCuentaPage";
import { DashboardPage } from "./pages/DashboardPage";
import { CajaPage } from "./pages/CajaPage";
import { MetasPage } from "./pages/MetasPage";
import { UsuariosPage } from "./pages/UsuariosPage";
import { ClientesListPage } from "./pages/clientes/ClientesListPage";
import { ClienteAltaPage } from "./pages/clientes/ClienteAltaPage";
import { ClienteDetailPage } from "./pages/clientes/ClienteDetailPage";
import { ContratoAltaPage } from "./pages/contratos/ContratoAltaPage";
import { ContratoDetailPage } from "./pages/contratos/ContratoDetailPage";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          {
            element: <ProtectedRoute roles={["admin"]} />,
            children: [
              { path: "/", element: <DashboardPage /> },
              { path: "/caja", element: <CajaPage /> },
              { path: "/metas", element: <MetasPage /> },
              { path: "/usuarios", element: <UsuariosPage /> },
              { path: "/clientes", element: <ClientesListPage /> },
              { path: "/clientes/:id", element: <ClienteDetailPage /> },
              { path: "/contratos/:id", element: <ContratoDetailPage /> },
            ],
          },
          {
            element: <ProtectedRoute roles={["admin", "vendedor"]} />,
            children: [
              { path: "/clientes/nuevo", element: <ClienteAltaPage /> },
              { path: "/clientes/:id/contratos/nuevo", element: <ContratoAltaPage /> },
            ],
          },
          {
            element: <ProtectedRoute roles={["cliente"]} />,
            children: [{ path: "/mi-cuenta", element: <MiCuentaPage /> }],
          },
        ],
      },
    ],
  },
]);
