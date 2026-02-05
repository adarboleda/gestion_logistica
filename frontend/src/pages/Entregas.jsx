import { useState, useEffect, useRef } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { Tag } from 'primereact/tag';
import { Toolbar } from 'primereact/toolbar';
import { TabView, TabPanel } from 'primereact/tabview';
import { FilterMatchMode } from 'primereact/api';
import { entregaService } from '../services';
import { useAuthStore } from '../context/authStore';

/**
 * PÁGINA DE ENTREGAS - SIMPLIFICADA
 *
 * Este módulo es para que el conductor marque el estado de la entrega.
 * Las entregas se crean automáticamente cuando una ruta pasa a estado "completada".
 * El tracking GPS está en el módulo de Rutas (cuando estado='en_transito').
 *
 * Estados de entrega:
 * - pendiente: Ruta completada, esperando que el conductor marque estado
 * - en_proceso: El conductor está realizando la entrega
 * - entregado: Entrega completada exitosamente
 * - retrasado: Entrega retrasada
 *
 * PERMISOS POR ROL:
 * - admin: Todo acceso
 * - coordinador: Solo puede ver, NO puede marcar estado
 * - conductor: Puede marcar estado de entregas
 */

function Entregas() {
  const toast = useRef(null);
  const { user } = useAuthStore();
  const [entregas, setEntregas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState('');
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });
  const [activeTab, setActiveTab] = useState(0);
  const [estadisticas, setEstadisticas] = useState({
    total: 0,
    pendientes: 0,
    en_proceso: 0,
    entregadas: 0,
    retrasadas: 0,
  });

  // Permisos según rol
  const puedeMarcarEstado = user?.rol === 'admin' || user?.rol === 'conductor';

  // Estados para el diálogo de marcar entrega
  const [showMarcarDialog, setShowMarcarDialog] = useState(false);
  const [entregaSeleccionada, setEntregaSeleccionada] = useState(null);
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [motivoNoEntrega, setMotivoNoEntrega] = useState('');
  const [observaciones, setObservaciones] = useState('');

  // Estados para historial
  const [periodoHistorial, setPeriodoHistorial] = useState('mes');
  const [historialData, setHistorialData] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const response = await entregaService.obtenerTodas({ limit: 100 });
      if (response.success) {
        setEntregas(response.data.entregas);
        setEstadisticas(response.data.estadisticas || {});
      }
    } catch {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar las entregas',
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const cargarHistorial = async (periodo) => {
    try {
      const response = await entregaService.obtenerHistorial({ periodo });
      if (response.success) {
        setHistorialData(response.data);
      }
    } catch {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo cargar el historial',
        life: 3000,
      });
    }
  };

  useEffect(() => {
    if (activeTab === 1) {
      cargarHistorial(periodoHistorial);
    }
  }, [activeTab, periodoHistorial]);

  // Abrir diálogo para marcar estado
  const abrirDialogoMarcar = (entrega, estado) => {
    setEntregaSeleccionada(entrega);
    setNuevoEstado(estado);
    setMotivoNoEntrega('');
    setObservaciones('');
    setShowMarcarDialog(true);
  };

  // Marcar estado de entrega
  const marcarEstado = async () => {
    if (!entregaSeleccionada || !nuevoEstado) return;

    // Validar motivo para estado retrasado
    if (nuevoEstado === 'retrasado' && !motivoNoEntrega.trim()) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Atención',
        detail: 'Debe indicar el motivo del retraso',
        life: 3000,
      });
      return;
    }

    try {
      const datos = {
        estado: nuevoEstado,
        observaciones: observaciones.trim() || undefined,
        motivoNoEntrega: motivoNoEntrega.trim() || undefined,
      };

      const response = await entregaService.actualizarEstado(
        entregaSeleccionada._id,
        datos,
      );

      if (response.success) {
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: `Entrega marcada como ${getEstadoLabel(nuevoEstado)}`,
          life: 3000,
        });
        setShowMarcarDialog(false);
        cargarDatos();
      }
    } catch {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo actualizar el estado',
        life: 3000,
      });
    }
  };

  const getEstadoLabel = (estado) => {
    const labels = {
      pendiente: 'Pendiente',
      en_proceso: 'En Proceso',
      entregado: 'Entregado',
      retrasado: 'Retrasado',
    };
    return labels[estado] || estado;
  };

  // Templates
  const estadoTemplate = (rowData) => {
    const estados = {
      pendiente: {
        label: 'Pendiente',
        severity: 'warning',
        icon: 'pi pi-clock',
      },
      en_proceso: {
        label: 'En Proceso',
        severity: 'info',
        icon: 'pi pi-spinner',
      },
      entregado: {
        label: 'Entregado',
        severity: 'success',
        icon: 'pi pi-check',
      },
      retrasado: {
        label: 'Retrasado',
        severity: 'danger',
        icon: 'pi pi-exclamation-triangle',
      },
    };
    const config = estados[rowData.estado] || {
      label: rowData.estado,
      severity: 'info',
    };
    return (
      <Tag value={config.label} severity={config.severity} icon={config.icon} />
    );
  };

  const fechaTemplate = (rowData) => {
    if (!rowData.fecha_programada) return 'N/A';
    return new Date(rowData.fecha_programada).toLocaleString('es-EC', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  };

  const clienteTemplate = (rowData) => {
    return (
      <div>
        <div className="font-semibold">{rowData.cliente?.nombre}</div>
        <div
          className="text-sm"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {rowData.cliente?.direccion?.substring(0, 30)}...
        </div>
      </div>
    );
  };

  const conductorTemplate = (rowData) => {
    return rowData.conductor?.nombre || 'Sin asignar';
  };

  const rutaTemplate = (rowData) => {
    return rowData.ruta?.numeroRuta || 'N/A';
  };

  const accionesTemplate = (rowData) => {
    // No mostrar acciones si el usuario es coordinador (solo puede ver)
    if (!puedeMarcarEstado) {
      return <span className="text-gray-400 text-sm italic">Solo lectura</span>;
    }

    // Solo mostrar acciones si está pendiente o en proceso
    if (!['pendiente', 'en_proceso'].includes(rowData.estado)) {
      return <span className="text-gray-400 text-sm">Finalizada</span>;
    }

    return (
      <div className="flex gap-1 flex-wrap">
        {rowData.estado === 'pendiente' && (
          <Button
            icon="pi pi-play"
            size="small"
            severity="info"
            tooltip="En Proceso"
            tooltipOptions={{ position: 'top' }}
            onClick={() => abrirDialogoMarcar(rowData, 'en_proceso')}
          />
        )}
        <Button
          icon="pi pi-check"
          size="small"
          severity="success"
          tooltip="Entregado"
          tooltipOptions={{ position: 'top' }}
          onClick={() => abrirDialogoMarcar(rowData, 'entregado')}
        />
        <Button
          icon="pi pi-exclamation-triangle"
          size="small"
          severity="danger"
          tooltip="Retrasado"
          tooltipOptions={{ position: 'top' }}
          onClick={() => abrirDialogoMarcar(rowData, 'retrasado')}
        />
      </div>
    );
  };

  const rightToolbarTemplate = () => {
    return (
      <div className="w-full md:w-auto">
        <span
          className="p-input-icon-left w-full"
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
            placeholder="Buscar..."
            className="w-full md:w-64"
            style={{ paddingLeft: '36px' }}
          />
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Toast ref={toast} />
      <ConfirmDialog />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Gestión de Entregas
          </h1>
          <p className="text-gray-600 mt-1">
            Marcar estado de entregas - El tracking GPS está en Rutas
          </p>
        </div>
        <button
          onClick={cargarDatos}
          className="p-2 text-gray-600 rounded-lg hover:bg-gray-100"
          title="Actualizar"
        >
          <i
            className={`pi pi-refresh text-xl ${loading ? 'pi-spin' : ''}`}
          ></i>
        </button>
      </div>

      {/* Cards de estadísticas con nuevos estados */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Pendientes</p>
            <p className="text-2xl font-bold text-yellow-600 mt-1">
              {loading ? '...' : estadisticas.pendientes || 0}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">En Proceso</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {loading ? '...' : estadisticas.en_proceso || 0}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Entregadas</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {loading ? '...' : estadisticas.entregadas || 0}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Retrasadas</p>
            <p className="text-2xl font-bold text-red-600 mt-1">
              {loading ? '...' : estadisticas.retrasadas || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <TabView
          activeIndex={activeTab}
          onTabChange={(e) => setActiveTab(e.index)}
        >
          {/* Tab de Entregas Pendientes */}
          <TabPanel header="Entregas Pendientes" leftIcon="pi pi-clock mr-2">
            <div className="mb-4">{rightToolbarTemplate()}</div>

            <DataTable
              value={entregas.filter((e) =>
                ['pendiente', 'en_proceso'].includes(e.estado),
              )}
              loading={loading}
              paginator
              rows={10}
              rowsPerPageOptions={[5, 10, 25]}
              filters={filters}
              globalFilterFields={[
                'numeroEntrega',
                'cliente.nombre',
                'conductor.nombre',
              ]}
              emptyMessage="No hay entregas pendientes"
              stripedRows
              className="border border-gray-200 rounded-lg"
            >
              <Column
                field="numeroEntrega"
                header="# Entrega"
                sortable
                style={{ minWidth: '120px' }}
              />
              <Column
                header="Ruta"
                body={rutaTemplate}
                style={{ minWidth: '100px' }}
              />
              <Column
                header="Cliente"
                body={clienteTemplate}
                style={{ minWidth: '200px' }}
              />
              <Column
                header="Fecha"
                body={fechaTemplate}
                sortable
                style={{ minWidth: '140px' }}
              />
              <Column
                header="Conductor"
                body={conductorTemplate}
                style={{ minWidth: '150px' }}
              />
              <Column
                header="Estado"
                body={estadoTemplate}
                style={{ minWidth: '120px' }}
              />
              <Column
                header="Marcar Estado"
                body={accionesTemplate}
                style={{ minWidth: '180px' }}
              />
            </DataTable>

            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-blue-800 text-sm">
                <i className="pi pi-info-circle mr-2"></i>
                <strong>Nota:</strong> Las entregas aparecen aquí cuando la ruta
                se marca como completada. El conductor debe marcar el estado
                final de cada entrega.
              </p>
            </div>
          </TabPanel>

          {/* Tab de Historial */}
          <TabPanel header="Historial" leftIcon="pi pi-history mr-2">
            <div className="mb-4 flex items-center gap-4">
              <span className="font-semibold text-gray-700">Periodo:</span>
              <Dropdown
                value={periodoHistorial}
                options={[
                  { label: 'Hoy', value: 'hoy' },
                  { label: 'Esta Semana', value: 'semana' },
                  { label: 'Este Mes', value: 'mes' },
                ]}
                onChange={(e) => setPeriodoHistorial(e.value)}
                placeholder="Seleccionar periodo"
              />
            </div>

            {historialData && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200 text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {historialData.estadisticas?.tasaExito || 0}%
                    </div>
                    <div className="text-gray-600 text-sm mt-1">
                      Tasa de Éxito
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {historialData.estadisticas?.entregadas || 0}
                    </div>
                    <div className="text-gray-600 text-sm mt-1">Entregadas</div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200 text-center">
                    <div className="text-3xl font-bold text-yellow-600">
                      {historialData.estadisticas?.en_proceso || 0}
                    </div>
                    <div className="text-gray-600 text-sm mt-1">En Proceso</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4 border border-red-200 text-center">
                    <div className="text-3xl font-bold text-red-600">
                      {historialData.estadisticas?.retrasadas || 0}
                    </div>
                    <div className="text-gray-600 text-sm mt-1">Retrasadas</div>
                  </div>
                </div>

                <DataTable
                  value={historialData.entregas}
                  paginator
                  rows={10}
                  emptyMessage="No hay entregas en el periodo seleccionado"
                  stripedRows
                  className="border border-gray-200 rounded-lg"
                >
                  <Column field="numeroEntrega" header="# Entrega" sortable />
                  <Column header="Cliente" body={clienteTemplate} />
                  <Column header="Fecha" body={fechaTemplate} sortable />
                  <Column header="Conductor" body={conductorTemplate} />
                  <Column header="Estado" body={estadoTemplate} />
                </DataTable>
              </>
            )}
          </TabPanel>

          {/* Tab de Todas las Entregas */}
          <TabPanel header="Todas las Entregas" leftIcon="pi pi-list mr-2">
            <div className="mb-4">{rightToolbarTemplate()}</div>

            <DataTable
              value={entregas}
              loading={loading}
              paginator
              rows={10}
              rowsPerPageOptions={[5, 10, 25]}
              filters={filters}
              globalFilterFields={[
                'numeroEntrega',
                'cliente.nombre',
                'conductor.nombre',
              ]}
              emptyMessage="No hay entregas registradas"
              stripedRows
              className="border border-gray-200 rounded-lg"
            >
              <Column
                field="numeroEntrega"
                header="# Entrega"
                sortable
                style={{ minWidth: '120px' }}
              />
              <Column
                header="Ruta"
                body={rutaTemplate}
                style={{ minWidth: '100px' }}
              />
              <Column
                header="Cliente"
                body={clienteTemplate}
                style={{ minWidth: '200px' }}
              />
              <Column
                header="Fecha"
                body={fechaTemplate}
                sortable
                style={{ minWidth: '140px' }}
              />
              <Column
                header="Conductor"
                body={conductorTemplate}
                style={{ minWidth: '150px' }}
              />
              <Column
                header="Estado"
                body={estadoTemplate}
                sortable
                style={{ minWidth: '130px' }}
              />
              <Column
                header="Acciones"
                body={accionesTemplate}
                style={{ minWidth: '180px' }}
              />
            </DataTable>
          </TabPanel>
        </TabView>
      </div>

      {/* Dialog para Marcar Estado de Entrega */}
      <Dialog
        visible={showMarcarDialog}
        onHide={() => setShowMarcarDialog(false)}
        header={`Marcar como ${getEstadoLabel(nuevoEstado)}`}
        modal
        style={{ width: '500px' }}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              label="Cancelar"
              severity="secondary"
              onClick={() => setShowMarcarDialog(false)}
            />
            <Button
              label="Confirmar"
              severity="success"
              onClick={marcarEstado}
            />
          </div>
        }
      >
        {entregaSeleccionada && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p>
                <strong>Entrega:</strong> {entregaSeleccionada.numeroEntrega}
              </p>
              <p>
                <strong>Cliente:</strong> {entregaSeleccionada.cliente?.nombre}
              </p>
              <p>
                <strong>Dirección:</strong>{' '}
                {entregaSeleccionada.cliente?.direccion}
              </p>
            </div>

            {/* Mostrar campo de motivo solo para estado retrasado */}
            {nuevoEstado === 'retrasado' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo del Retraso <span className="text-red-500">*</span>
                </label>
                <InputTextarea
                  value={motivoNoEntrega}
                  onChange={(e) => setMotivoNoEntrega(e.target.value)}
                  rows={3}
                  className="w-full"
                  placeholder="Indique el motivo del retraso..."
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observaciones (opcional)
              </label>
              <InputTextarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={2}
                className="w-full"
                placeholder="Observaciones adicionales..."
              />
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}

export default Entregas;
