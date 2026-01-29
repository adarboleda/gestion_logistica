import { useState, useEffect, useRef } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Tag } from 'primereact/tag';
import { Toolbar } from 'primereact/toolbar';
import { FilterMatchMode } from 'primereact/api';
import { bodegaService } from '../services';

function Bodegas() {
  const toast = useRef(null);
  const [bodegas, setBodegas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [globalFilter, setGlobalFilter] = useState('');
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  const [formData, setFormData] = useState({
    nombre: '',
    calle: '',
    ciudad: '',
    estado: '',
    codigoPostal: '',
    capacidadMaxima: 0,
    descripcion: '',
  });

  useEffect(() => {
    cargarBodegas();
  }, []);

  const cargarBodegas = async () => {
    setLoading(true);
    try {
      const response = await bodegaService.obtenerTodas({ limit: 100 });
      if (response.success) {
        setBodegas(response.data.bodegas);
      }
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar las bodegas',
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

  const abrirDialogoEditar = (bodega) => {
    setFormData({
      _id: bodega._id,
      nombre: bodega.nombre,
      calle: bodega.direccion?.calle || '',
      ciudad: bodega.direccion?.ciudad || '',
      estado: bodega.direccion?.estado || '',
      codigoPostal: bodega.direccion?.codigoPostal || '',
      capacidadMaxima: bodega.capacidadMaxima || 0,
      descripcion: bodega.descripcion || '',
    });
    setEditMode(true);
    setShowDialog(true);
  };

  const resetFormulario = () => {
    setFormData({
      nombre: '',
      calle: '',
      ciudad: '',
      estado: '',
      codigoPostal: '',
      capacidadMaxima: 0,
      descripcion: '',
    });
  };

  const handleSubmit = async () => {
    if (
      !formData.nombre ||
      !formData.calle ||
      !formData.ciudad ||
      !formData.estado
    ) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Validación',
        detail:
          'Complete los campos requeridos (nombre, calle, ciudad, estado)',
        life: 3000,
      });
      return;
    }

    setLoading(true);
    try {
      // Formatear datos según el modelo del backend
      const dataToSend = {
        nombre: formData.nombre,
        direccion: {
          calle: formData.calle,
          ciudad: formData.ciudad,
          estado: formData.estado,
          codigoPostal: formData.codigoPostal,
        },
        capacidadMaxima: formData.capacidadMaxima,
        descripcion: formData.descripcion,
      };

      let response;
      if (editMode) {
        response = await bodegaService.actualizar(formData._id, dataToSend);
      } else {
        response = await bodegaService.crear(dataToSend);
      }

      if (response.success) {
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: editMode ? 'Bodega actualizada' : 'Bodega creada',
          life: 3000,
        });
        setShowDialog(false);
        cargarBodegas();
      }
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data?.message || 'Error al guardar la bodega',
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmarEliminar = (bodega) => {
    confirmDialog({
      message: `¿Está seguro de eliminar la bodega "${bodega.nombre}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => eliminarBodega(bodega._id),
    });
  };

  const eliminarBodega = async (id) => {
    setLoading(true);
    try {
      const response = await bodegaService.eliminar(id);
      if (response.success) {
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Bodega eliminada',
          life: 3000,
        });
        cargarBodegas();
      }
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo eliminar la bodega',
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleActivo = async (bodega) => {
    try {
      const nuevoEstado = bodega.estado === 'activa' ? 'inactiva' : 'activa';
      const response = await bodegaService.actualizar(bodega._id, {
        estado: nuevoEstado,
      });
      if (response.success) {
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: `Bodega ${nuevoEstado === 'activa' ? 'activada' : 'desactivada'}`,
          life: 3000,
        });
        cargarBodegas();
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
  const estadoTemplate = (rowData) => {
    return (
      <Tag
        value={rowData.estado === 'activa' ? 'Activa' : 'Inactiva'}
        severity={rowData.estado === 'activa' ? 'success' : 'danger'}
      />
    );
  };

  const capacidadTemplate = (rowData) => {
    return rowData.capacidadMaxima
      ? `${rowData.capacidadMaxima.toLocaleString('es-CO')} unidades`
      : 'N/A';
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
          icon={rowData.estado === 'activa' ? 'pi pi-ban' : 'pi pi-check'}
          rounded
          outlined
          severity="warning"
          onClick={() => toggleActivo(rowData)}
          tooltip={rowData.estado === 'activa' ? 'Desactivar' : 'Activar'}
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
        label="Nueva Bodega"
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
          placeholder="Buscar bodegas..."
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
        title="Gestión de Bodegas"
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
          value={bodegas}
          loading={loading}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          filters={filters}
          globalFilterFields={[
            'nombre',
            'direccion.ciudad',
            'direccion.calle',
            'descripcion',
          ]}
          emptyMessage="No se encontraron bodegas"
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
            field="direccion.ciudad"
            header="Ciudad"
            sortable
            style={{ minWidth: '150px' }}
          />
          <Column
            field="direccion.calle"
            header="Dirección"
            sortable
            style={{ minWidth: '250px' }}
          />
          <Column
            field="capacidadMaxima"
            header="Capacidad"
            body={capacidadTemplate}
            sortable
            style={{ minWidth: '120px' }}
          />
          <Column
            field="descripcion"
            header="Descripción"
            sortable
            style={{ minWidth: '200px' }}
          />
          <Column
            field="estado"
            header="Estado"
            body={estadoTemplate}
            sortable
            style={{ minWidth: '100px' }}
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
        header={editMode ? 'Editar Bodega' : 'Nueva Bodega'}
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
              Nombre *
            </label>
            <InputText
              value={formData.nombre}
              onChange={(e) =>
                setFormData({ ...formData, nombre: e.target.value })
              }
              className="w-full"
            />
          </div>

          <div className="col-span-2">
            <label
              className="block mb-2 font-semibold"
              style={{ color: 'var(--color-secondary)' }}
            >
              Calle / Dirección *
            </label>
            <InputText
              value={formData.calle}
              onChange={(e) =>
                setFormData({ ...formData, calle: e.target.value })
              }
              className="w-full"
              placeholder="Ej: Calle 100 #15-20"
            />
          </div>

          <div className="col-span-1">
            <label
              className="block mb-2 font-semibold"
              style={{ color: 'var(--color-secondary)' }}
            >
              Ciudad *
            </label>
            <InputText
              value={formData.ciudad}
              onChange={(e) =>
                setFormData({ ...formData, ciudad: e.target.value })
              }
              className="w-full"
              placeholder="Ej: Bogotá"
            />
          </div>

          <div className="col-span-1">
            <label
              className="block mb-2 font-semibold"
              style={{ color: 'var(--color-secondary)' }}
            >
              Estado/Departamento *
            </label>
            <InputText
              value={formData.estado}
              onChange={(e) =>
                setFormData({ ...formData, estado: e.target.value })
              }
              className="w-full"
              placeholder="Ej: Cundinamarca"
            />
          </div>

          <div className="col-span-1">
            <label
              className="block mb-2 font-semibold"
              style={{ color: 'var(--color-secondary)' }}
            >
              Código Postal
            </label>
            <InputText
              value={formData.codigoPostal}
              onChange={(e) =>
                setFormData({ ...formData, codigoPostal: e.target.value })
              }
              className="w-full"
              placeholder="5 dígitos"
              maxLength={5}
            />
          </div>

          <div className="col-span-1">
            <label
              className="block mb-2 font-semibold"
              style={{ color: 'var(--color-secondary)' }}
            >
              Capacidad Máxima
            </label>
            <InputText
              type="number"
              value={formData.capacidadMaxima}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  capacidadMaxima: parseInt(e.target.value) || 0,
                })
              }
              className="w-full"
              placeholder="Unidades"
            />
          </div>

          <div className="col-span-2">
            <label
              className="block mb-2 font-semibold"
              style={{ color: 'var(--color-secondary)' }}
            >
              Descripción
            </label>
            <InputText
              value={formData.descripcion}
              onChange={(e) =>
                setFormData({ ...formData, descripcion: e.target.value })
              }
              className="w-full"
              placeholder="Descripción de la bodega"
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}

export default Bodegas;
