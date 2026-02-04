import { useState, useEffect, useRef } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Tag } from 'primereact/tag';
import { Toolbar } from 'primereact/toolbar';
import { FilterMatchMode } from 'primereact/api';
import { usuarioService } from '../services';

function Usuarios() {
  const toast = useRef(null);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [globalFilter, setGlobalFilter] = useState('');
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: '',
    telefono: '',
  });

  const roles = [
    { label: 'Administrador', value: 'admin' },
    { label: 'Coordinador', value: 'coordinador' },
    { label: 'Operador', value: 'operador' },
    { label: 'Conductor', value: 'conductor' },
  ];

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    setLoading(true);
    try {
      const response = await usuarioService.obtenerTodos({ limit: 100 });
      if (response.success) {
        setUsuarios(response.data.usuarios);
      }
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar los usuarios',
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogoNuevo = () => {
    resetFormulario();
    setEditMode(false);
    setShowDialog(true);
  };

  const abrirDialogoEditar = (usuario) => {
    setFormData({
      _id: usuario._id,
      nombre: usuario.nombre,
      email: usuario.email,
      password: '',
      rol: usuario.rol,
      telefono: usuario.telefono || '',
    });
    setEditMode(true);
    setShowDialog(true);
  };

  const resetFormulario = () => {
    setFormData({
      nombre: '',
      email: '',
      password: '',
      rol: '',
      telefono: '',
    });
  };

  const handleSubmit = async () => {
    if (!formData.nombre || !formData.email || !formData.rol) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Complete los campos requeridos',
        life: 3000,
      });
      return;
    }

    if (!editMode && !formData.password) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Validación',
        detail: 'La contraseña es requerida para nuevos usuarios',
        life: 3000,
      });
      return;
    }

    setLoading(true);
    try {
      let response;
      if (editMode) {
        const dataToUpdate = { ...formData };
        if (!dataToUpdate.password) {
          delete dataToUpdate.password;
        }
        response = await usuarioService.actualizar(formData._id, dataToUpdate);
      } else {
        response = await usuarioService.crear(formData);
      }

      if (response.success) {
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: editMode ? 'Usuario actualizado' : 'Usuario creado',
          life: 3000,
        });
        setShowDialog(false);
        cargarUsuarios();
      }
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data?.message || 'Error al guardar el usuario',
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmarEliminar = (usuario) => {
    confirmDialog({
      message: `¿Está seguro de eliminar el usuario "${usuario.nombre}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => eliminarUsuario(usuario._id),
    });
  };

  const eliminarUsuario = async (id) => {
    setLoading(true);
    try {
      const response = await usuarioService.eliminar(id);
      if (response.success) {
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Usuario eliminado',
          life: 3000,
        });
        cargarUsuarios();
      }
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo eliminar el usuario',
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleActivo = async (usuario) => {
    try {
      const response = await usuarioService.actualizar(usuario._id, {
        activo: !usuario.activo,
      });
      if (response.success) {
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: `Usuario ${usuario.activo ? 'desactivado' : 'activado'}`,
          life: 3000,
        });
        cargarUsuarios();
      }
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo actualizar el estado',
        life: 3000,
      });
    }
  };

  // Templates
  const rolTemplate = (rowData) => {
    const rolMap = {
      admin: { label: 'Admin', severity: 'danger' },
      coordinador: { label: 'Coordinador', severity: 'info' },
      operador: { label: 'Operador', severity: 'warning' },
      conductor: { label: 'Conductor', severity: 'success' },
    };

    const config = rolMap[rowData.rol] || {
      label: rowData.rol,
      severity: 'secondary',
    };

    return <Tag value={config.label} severity={config.severity} />;
  };

  const activoTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.activo ? 'Activo' : 'Inactivo'}
        severity={rowData.activo ? 'success' : 'danger'}
      />
    );
  };

  const accionesTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          rounded
          outlined
          severity="info"
          onClick={() => abrirDialogoEditar(rowData)}
          tooltip="Editar"
        />
        <Button
          icon={rowData.activo ? 'pi pi-ban' : 'pi pi-check'}
          rounded
          outlined
          severity="warning"
          onClick={() => toggleActivo(rowData)}
          tooltip={rowData.activo ? 'Desactivar' : 'Activar'}
        />
        <Button
          icon="pi pi-trash"
          rounded
          outlined
          severity="danger"
          onClick={() => confirmarEliminar(rowData)}
          tooltip="Eliminar"
        />
      </div>
    );
  };

  const leftToolbarTemplate = () => {
    return (
      <Button
        label="Nuevo Usuario"
        icon="pi pi-plus"
        severity="success"
        onClick={abrirDialogoNuevo}
      />
    );
  };

  const rightToolbarTemplate = () => {
    return (
      <span
        className="p-input-icon-left"
        style={{ position: 'relative', display: 'inline-block' }}
      >
        <i
          className="pi pi-search"
          style={{
            position: 'absolute',
            left: '12px',
            top: '65%',
            transform: 'translateY(-50%)',
            color: '#6b7280',
          }}
        />
        <InputText
          value={globalFilter}
          onChange={(e) => {
            setGlobalFilter(e.target.value);
            setFilters({
              global: {
                value: e.target.value,
                matchMode: FilterMatchMode.CONTAINS,
              },
            });
          }}
          placeholder="Buscar usuarios..."
          style={{ width: '300px', paddingLeft: '36px' }}
        />
      </span>
    );
  };

  const dialogFooter = (
    <div>
      <Button
        label="Cancelar"
        icon="pi pi-times"
        outlined
        onClick={() => setShowDialog(false)}
      />
      <Button
        label="Guardar"
        icon="pi pi-check"
        loading={loading}
        onClick={handleSubmit}
      />
    </div>
  );

  return (
    <div className="p-4">
      <Toast ref={toast} />
      <ConfirmDialog />

      <Card
        title="Gestión de Usuarios"
        className="shadow-lg"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <Toolbar
          left={leftToolbarTemplate}
          right={rightToolbarTemplate}
          className="mb-4"
          style={{
            backgroundColor: 'var(--color-accent)',
            border: '1px solid var(--color-border)',
          }}
        />

        <DataTable
          value={usuarios}
          loading={loading}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          filters={filters}
          globalFilterFields={['nombre', 'email', 'rol', 'telefono']}
          emptyMessage="No se encontraron usuarios"
          stripedRows
          style={{ border: '1px solid var(--color-border)' }}
        >
          <Column
            field="nombre"
            header="Nombre"
            sortable
            style={{ minWidth: '200px' }}
          />
          <Column
            field="email"
            header="Email"
            sortable
            style={{ minWidth: '200px' }}
          />
          <Column
            field="telefono"
            header="Teléfono"
            sortable
            style={{ minWidth: '120px' }}
          />
          <Column
            field="rol"
            header="Rol"
            body={rolTemplate}
            sortable
            style={{ minWidth: '120px' }}
          />
          <Column
            field="activo"
            header="Estado"
            body={activoTemplate}
            sortable
            style={{ minWidth: '100px' }}
          />
          <Column
            field="createdAt"
            header="Creado"
            body={(rowData) =>
              rowData.createdAt
                ? new Date(rowData.createdAt).toLocaleDateString('es-EC')
                : 'N/A'
            }
            sortable
            style={{ minWidth: '110px' }}
          />
          <Column
            header="Acciones"
            body={accionesTemplate}
            style={{ minWidth: '180px' }}
          />
        </DataTable>
      </Card>

      <Dialog
        visible={showDialog}
        onHide={() => setShowDialog(false)}
        header={editMode ? 'Editar Usuario' : 'Nuevo Usuario'}
        modal
        style={{ width: '600px' }}
        footer={dialogFooter}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label
              className="block mb-2 font-semibold"
              style={{ color: 'var(--color-secondary)' }}
            >
              Nombre Completo *
            </label>
            <InputText
              value={formData.nombre}
              onChange={(e) =>
                setFormData({ ...formData, nombre: e.target.value })
              }
              className="w-full"
            />
          </div>

          <div className="col-span-1">
            <label
              className="block mb-2 font-semibold"
              style={{ color: 'var(--color-secondary)' }}
            >
              Email *
            </label>
            <InputText
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full"
              disabled={editMode}
            />
          </div>

          <div className="col-span-1">
            <label
              className="block mb-2 font-semibold"
              style={{ color: 'var(--color-secondary)' }}
            >
              Teléfono
            </label>
            <InputText
              value={formData.telefono}
              onChange={(e) =>
                setFormData({ ...formData, telefono: e.target.value })
              }
              className="w-full"
            />
          </div>

          <div className="col-span-1">
            <label
              className="block mb-2 font-semibold"
              style={{ color: 'var(--color-secondary)' }}
            >
              Rol *
            </label>
            <Dropdown
              value={formData.rol}
              onChange={(e) => setFormData({ ...formData, rol: e.value })}
              options={roles}
              placeholder="Seleccione"
              className="w-full"
            />
          </div>

          <div className="col-span-1">
            <label
              className="block mb-2 font-semibold"
              style={{ color: 'var(--color-secondary)' }}
            >
              {editMode ? 'Nueva Contraseña (opcional)' : 'Contraseña *'}
            </label>
            <Password
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="w-full"
              toggleMask
              feedback={!editMode}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}

export default Usuarios;
