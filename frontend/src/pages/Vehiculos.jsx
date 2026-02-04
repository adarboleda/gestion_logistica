import { useState, useEffect, useRef } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Tag } from 'primereact/tag';
import { Toolbar } from 'primereact/toolbar';
import { FilterMatchMode } from 'primereact/api';
import api from '../services/api';
import { usuarioService } from '../services';

function Vehiculos() {
  const toast = useRef(null);
  const [vehiculos, setVehiculos] = useState([]);
  const [conductores, setConductores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [globalFilter, setGlobalFilter] = useState('');
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  const [formData, setFormData] = useState({
    placa: '',
    marca: '',
    modelo: '',
    año: new Date().getFullYear(),
    tipo: '',
    capacidad_carga: 0,
    unidad_capacidad: 'kg',
    estado: 'disponible',
    conductor_asignado: null,
    kilometraje: 0,
  });

  const tiposVehiculo = [
    { label: 'Camión', value: 'camion' },
    { label: 'Camioneta', value: 'camioneta' },
    { label: 'Van', value: 'van' },
    { label: 'Motocicleta', value: 'motocicleta' },
  ];

  const unidadesCapacidad = [
    { label: 'Kilogramos', value: 'kg' },
    { label: 'Toneladas', value: 'toneladas' },
    { label: 'Metros cúbicos', value: 'm3' },
  ];

  const estadosVehiculo = [
    { label: 'Disponible', value: 'disponible' },
    { label: 'En ruta', value: 'en_ruta' },
    { label: 'Mantenimiento', value: 'mantenimiento' },
  ];

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [respVehiculos, respConductores] = await Promise.all([
        api.get('/vehiculos'),
        usuarioService.obtenerPorRol('conductor'),
      ]);

      if (respVehiculos.data.success) {
        setVehiculos(respVehiculos.data.data.vehiculos);
      }
      if (respConductores.success) {
        setConductores(respConductores.data.usuarios);
      }
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar los datos',
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

  const abrirDialogoEditar = (vehiculo) => {
    setFormData({
      _id: vehiculo._id,
      placa: vehiculo.placa,
      marca: vehiculo.marca,
      modelo: vehiculo.modelo,
      año: vehiculo.año,
      tipo: vehiculo.tipo,
      capacidad_carga: vehiculo.capacidad_carga,
      unidad_capacidad: vehiculo.unidad_capacidad || 'kg',
      estado: vehiculo.estado,
      conductor_asignado: vehiculo.conductor_asignado?._id || null,
      kilometraje: vehiculo.kilometraje || 0,
    });
    setEditMode(true);
    setShowDialog(true);
  };

  const resetFormulario = () => {
    setFormData({
      placa: '',
      marca: '',
      modelo: '',
      año: new Date().getFullYear(),
      tipo: '',
      capacidad_carga: 0,
      unidad_capacidad: 'kg',
      estado: 'disponible',
      conductor_asignado: null,
      kilometraje: 0,
    });
  };

  const handleSubmit = async () => {
    if (!formData.placa || !formData.marca || !formData.tipo) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Complete los campos requeridos',
        life: 3000,
      });
      return;
    }

    setLoading(true);
    try {
      let response;
      if (editMode) {
        response = await api.put(`/vehiculos/${formData._id}`, formData);
      } else {
        response = await api.post('/vehiculos', formData);
      }

      if (response.data.success) {
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: editMode ? 'Vehículo actualizado' : 'Vehículo creado',
          life: 3000,
        });
        setShowDialog(false);
        cargarDatos();
      }
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data?.message || 'Error al guardar el vehículo',
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmarEliminar = (vehiculo) => {
    confirmDialog({
      message: `¿Está seguro de eliminar el vehículo con placa "${vehiculo.placa}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => eliminarVehiculo(vehiculo._id),
    });
  };

  const eliminarVehiculo = async (id) => {
    setLoading(true);
    try {
      const response = await api.delete(`/vehiculos/${id}`);
      if (response.data.success) {
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Vehículo eliminado',
          life: 3000,
        });
        cargarDatos();
      }
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo eliminar el vehículo',
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Templates
  const estadoTemplate = (rowData) => {
    const severityMap = {
      disponible: 'success',
      en_ruta: 'info',
      mantenimiento: 'warning',
    };

    const labelMap = {
      disponible: 'Disponible',
      en_ruta: 'En Ruta',
      mantenimiento: 'Mantenimiento',
    };

    return (
      <Tag
        value={labelMap[rowData.estado] || rowData.estado}
        severity={severityMap[rowData.estado] || 'secondary'}
      />
    );
  };

  const conductorTemplate = (rowData) => {
    return rowData.conductor_asignado ? (
      <div>
        <div className="font-semibold">{rowData.conductor_asignado.nombre}</div>
        <div
          className="text-sm"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {rowData.conductor_asignado.telefono || ''}
        </div>
      </div>
    ) : (
      <span style={{ color: 'var(--color-text-secondary)' }}>Sin asignar</span>
    );
  };

  const kilometrajeTemplate = (rowData) => {
    return rowData.kilometraje
      ? `${rowData.kilometraje.toLocaleString('es-EC')} km`
      : '0 km';
  };

  const capacidadTemplate = (rowData) => {
    const unidadLabel = {
      kg: 'kg',
      toneladas: 'ton',
      m3: 'm³',
    };
    return `${rowData.capacidad_carga} ${unidadLabel[rowData.unidad_capacidad] || rowData.unidad_capacidad}`;
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
        label="Nuevo Vehículo"
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
          placeholder="Buscar vehículos..."
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
        title="Gestión de Vehículos"
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
          value={vehiculos}
          loading={loading}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          filters={filters}
          globalFilterFields={['placa', 'marca', 'modelo', 'tipo']}
          emptyMessage="No se encontraron vehículos"
          stripedRows
          style={{ border: '1px solid var(--color-border)' }}
        >
          <Column
            field="placa"
            header="Placa"
            sortable
            style={{ minWidth: '120px' }}
          />
          <Column
            field="marca"
            header="Marca"
            sortable
            style={{ minWidth: '150px' }}
          />
          <Column
            field="modelo"
            header="Modelo"
            sortable
            style={{ minWidth: '150px' }}
          />
          <Column
            field="año"
            header="Año"
            sortable
            style={{ minWidth: '100px' }}
          />
          <Column
            field="tipo"
            header="Tipo"
            sortable
            style={{ minWidth: '120px' }}
          />
          <Column
            header="Capacidad"
            body={capacidadTemplate}
            style={{ minWidth: '120px' }}
          />
          <Column
            header="Conductor"
            body={conductorTemplate}
            style={{ minWidth: '180px' }}
          />
          <Column
            header="Kilometraje"
            body={kilometrajeTemplate}
            sortable
            style={{ minWidth: '120px' }}
          />
          <Column
            field="estado"
            header="Estado"
            body={estadoTemplate}
            sortable
            style={{ minWidth: '150px' }}
          />
          <Column
            header="Acciones"
            body={accionesTemplate}
            style={{ minWidth: '120px' }}
          />
        </DataTable>
      </Card>

      <Dialog
        visible={showDialog}
        onHide={() => setShowDialog(false)}
        header={editMode ? 'Editar Vehículo' : 'Nuevo Vehículo'}
        modal
        style={{ width: '600px' }}
        footer={dialogFooter}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-1">
            <label
              className="block mb-2 font-semibold"
              style={{ color: 'var(--color-secondary)' }}
            >
              Placa *
            </label>
            <InputText
              value={formData.placa}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  placa: e.target.value.toUpperCase(),
                })
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
              Tipo *
            </label>
            <Dropdown
              value={formData.tipo}
              onChange={(e) => setFormData({ ...formData, tipo: e.value })}
              options={tiposVehiculo}
              placeholder="Seleccione"
              className="w-full"
            />
          </div>

          <div className="col-span-1">
            <label
              className="block mb-2 font-semibold"
              style={{ color: 'var(--color-secondary)' }}
            >
              Marca *
            </label>
            <InputText
              value={formData.marca}
              onChange={(e) =>
                setFormData({ ...formData, marca: e.target.value })
              }
              className="w-full"
            />
          </div>

          <div className="col-span-1">
            <label
              className="block mb-2 font-semibold"
              style={{ color: 'var(--color-secondary)' }}
            >
              Modelo *
            </label>
            <InputText
              value={formData.modelo}
              onChange={(e) =>
                setFormData({ ...formData, modelo: e.target.value })
              }
              className="w-full"
            />
          </div>

          <div className="col-span-1">
            <label
              className="block mb-2 font-semibold"
              style={{ color: 'var(--color-secondary)' }}
            >
              Año
            </label>
            <InputNumber
              value={formData.año}
              onValueChange={(e) => setFormData({ ...formData, año: e.value })}
              className="w-full"
              useGrouping={false}
            />
          </div>

          <div className="col-span-1">
            <label
              className="block mb-2 font-semibold"
              style={{ color: 'var(--color-secondary)' }}
            >
              Estado
            </label>
            <Dropdown
              value={formData.estado}
              onChange={(e) => setFormData({ ...formData, estado: e.value })}
              options={estadosVehiculo}
              placeholder="Seleccione"
              className="w-full"
            />
          </div>

          <div className="col-span-1">
            <label
              className="block mb-2 font-semibold"
              style={{ color: 'var(--color-secondary)' }}
            >
              Capacidad de Carga
            </label>
            <InputNumber
              value={formData.capacidad_carga}
              onValueChange={(e) =>
                setFormData({ ...formData, capacidad_carga: e.value })
              }
              className="w-full"
              min={0}
            />
          </div>

          <div className="col-span-1">
            <label
              className="block mb-2 font-semibold"
              style={{ color: 'var(--color-secondary)' }}
            >
              Unidad de Capacidad
            </label>
            <Dropdown
              value={formData.unidad_capacidad}
              onChange={(e) =>
                setFormData({ ...formData, unidad_capacidad: e.value })
              }
              options={unidadesCapacidad}
              placeholder="Seleccione"
              className="w-full"
            />
          </div>

          <div className="col-span-1">
            <label
              className="block mb-2 font-semibold"
              style={{ color: 'var(--color-secondary)' }}
            >
              Conductor Asignado
            </label>
            <Dropdown
              value={formData.conductor_asignado}
              onChange={(e) =>
                setFormData({ ...formData, conductor_asignado: e.value })
              }
              options={conductores.map((c) => ({
                label: `${c.nombre} (${c.telefono || 'Sin teléfono'})`,
                value: c._id,
              }))}
              placeholder="Seleccione conductor"
              className="w-full"
              showClear
              filter
            />
          </div>

          <div className="col-span-1">
            <label
              className="block mb-2 font-semibold"
              style={{ color: 'var(--color-secondary)' }}
            >
              Kilometraje
            </label>
            <InputNumber
              value={formData.kilometraje}
              onValueChange={(e) =>
                setFormData({ ...formData, kilometraje: e.value })
              }
              className="w-full"
              min={0}
              suffix=" km"
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}

export default Vehiculos;
