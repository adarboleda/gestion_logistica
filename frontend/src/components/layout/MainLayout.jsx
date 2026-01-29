import { Outlet } from 'react-router-dom';
import Navbar from '../Navbar';
import Sidebar from '../Sidebar';
import { useState, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { useAuthStore } from '../../context/authStore';
import api from '../../services/api';

function MainLayout() {
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user, login } = useAuthStore();
  const toast = useRef(null);

  const [profileData, setProfileData] = useState({
    nombre: '',
    telefono: '',
    password: '',
    confirmPassword: '',
  });

  const openProfileDialog = () => {
    setProfileData({
      nombre: user?.nombre || '',
      telefono: user?.telefono || '',
      password: '',
      confirmPassword: '',
    });
    setShowProfileDialog(true);
  };

  const handleUpdateProfile = async () => {
    if (
      profileData.password &&
      profileData.password !== profileData.confirmPassword
    ) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Las contraseñas no coinciden',
        life: 3000,
      });
      return;
    }

    setLoading(true);
    try {
      const dataToUpdate = {
        nombre: profileData.nombre,
        telefono: profileData.telefono,
      };

      if (profileData.password) {
        dataToUpdate.password = profileData.password;
      }

      const response = await api.put('/auth/perfil', dataToUpdate);

      if (response.data.success) {
        // Actualizar el usuario en el store
        const token = localStorage.getItem('token');
        login(response.data.data.usuario, token);

        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Perfil actualizado correctamente',
          life: 3000,
        });
        setShowProfileDialog(false);
      }
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data?.message || 'Error al actualizar perfil',
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Toast ref={toast} />

      {/* Navbar superior */}
      <Navbar
        onToggleSidebar={() => setSidebarVisible(!sidebarVisible)}
        onOpenProfile={openProfileDialog}
      />

      <div className="flex flex-1">
        {/* Sidebar lateral */}
        {sidebarVisible && <Sidebar />}

        {/* Contenido principal */}
        <main className="flex-1 p-6 overflow-auto bg-gray-100">
          <Outlet />
        </main>
      </div>

      {/* Dialog de Perfil */}
      <Dialog
        header="Mi Perfil"
        visible={showProfileDialog}
        style={{ width: '450px' }}
        onHide={() => setShowProfileDialog(false)}
        modal
        footer={
          <div>
            <Button
              label="Cancelar"
              icon="pi pi-times"
              outlined
              onClick={() => setShowProfileDialog(false)}
            />
            <Button
              label="Guardar"
              icon="pi pi-check"
              loading={loading}
              onClick={handleUpdateProfile}
            />
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-900">
              Email
            </label>
            <InputText
              value={user?.email || ''}
              disabled
              className="w-full bg-gray-100"
            />
            <small className="text-gray-500">
              El email no se puede cambiar
            </small>
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-900">
              Nombre *
            </label>
            <InputText
              value={profileData.nombre}
              onChange={(e) =>
                setProfileData({ ...profileData, nombre: e.target.value })
              }
              className="w-full"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-900">
              Teléfono
            </label>
            <InputText
              value={profileData.telefono}
              onChange={(e) =>
                setProfileData({ ...profileData, telefono: e.target.value })
              }
              className="w-full"
              placeholder="10 dígitos"
              maxLength={10}
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-900">
              Rol
            </label>
            <InputText
              value={user?.rol || ''}
              disabled
              className="w-full bg-gray-100 capitalize"
            />
          </div>

          <hr className="my-4" />

          <p className="text-sm text-gray-600">
            <i className="pi pi-info-circle mr-1"></i>
            Deja en blanco si no deseas cambiar la contraseña
          </p>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-900">
              Nueva Contraseña
            </label>
            <Password
              value={profileData.password}
              onChange={(e) =>
                setProfileData({ ...profileData, password: e.target.value })
              }
              className="w-full"
              toggleMask
              feedback={false}
              inputClassName="w-full"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-900">
              Confirmar Contraseña
            </label>
            <Password
              value={profileData.confirmPassword}
              onChange={(e) =>
                setProfileData({
                  ...profileData,
                  confirmPassword: e.target.value,
                })
              }
              className="w-full"
              toggleMask
              feedback={false}
              inputClassName="w-full"
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}

export default MainLayout;
