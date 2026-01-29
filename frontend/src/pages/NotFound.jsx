import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { useNavigate } from 'react-router-dom';

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex align-items-center justify-content-center min-h-screen">
      <Card className="text-center shadow-4">
        <i className="pi pi-exclamation-triangle text-6xl text-orange-500 mb-4"></i>
        <h1 className="text-6xl font-bold mb-2">404</h1>
        <h2 className="text-2xl mb-4">Página no encontrada</h2>
        <p className="text-500 mb-4">
          La página que buscas no existe o ha sido movida.
        </p>
        <Button
          label="Volver al Dashboard"
          icon="pi pi-home"
          onClick={() => navigate('/dashboard')}
        />
      </Card>
    </div>
  );
}

export default NotFound;
