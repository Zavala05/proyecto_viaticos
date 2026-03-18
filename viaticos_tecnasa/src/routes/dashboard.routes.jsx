import { Routes, Route } from "react-router-dom";
import Dashboard from "../page/Dashboard/Dashboard";
import ViaticosMapa from "../page/viaticos/ViaticosForm";
import RegisterUser from "../page/viaticos/registeruser";
import AddClient from "../page/viaticos/addclient";
import TablaViaticos from "../page/viaticos/TablaViaticos";

import GetUbis from "../page/localizaciones/Ubicaciones_viaticos";

export default function DashboardRoutes() {
  return (
    <Routes>
      <Route path="viaticos" element={<ViaticosMapa /> } />
      <Route path="dashboard/editar/:id" element={<ViaticosMapa /> } />
      <Route path="registrarusuario" element={<RegisterUser/>}/>
      <Route path="agregarcliente" element={<AddClient/>}/>
      <Route path="ubicaciones" element={<GetUbis/>}/>
      
    </Routes>
  );
}