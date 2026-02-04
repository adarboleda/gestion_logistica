import { useState, useEffect, useRef } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Tag } from 'primereact/tag';
import { Toolbar } from 'primereact/toolbar';
import { TabView, TabPanel } from 'primereact/tabview';
import { ProgressBar } from 'primereact/progressbar';
import { Timeline } from 'primereact/timeline';
import { Divider } from 'primereact/divider';
import { FilterMatchMode } from 'primereact/api';
import { entregaService } from '../services';

function Entregas() {
  const toast = useRef(null);
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

  // Estados para tracking
  const [showTrackingDialog, setShowTrackingDialog] = useState(false);
  const [entregaSeleccionada, setEntregaSeleccionada] = useState(null);
  const [trackingData, setTrackingData] = useState(null);
  const [simulandoTracking, setSimulandoTracking] = useState(false);
  const [intervaloTracking, setIntervaloTracking] = useState(null);

  // Estados para historial
  const [periodoHistorial, setPeriodoHistorial] = useState('mes');
  const [historialData, setHistorialData] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    // Limpiar intervalo al desmontar
    return () => {
      if (intervaloTracking) {
        clearInterval(intervaloTracking);
      }
    };
  }, [intervaloTracking]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const response = await entregaService.obtenerTodas({ limit: 100 });
      if (response.success) {
        setEntregas(response.data.entregas);
        setEstadisticas(response.data.estadisticas);
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
    if (activeTab === 2) {
      cargarHistorial(periodoHistorial);
    }
  }, [activeTab, periodoHistorial]);

  // Funciones de tracking
  const verTracking = async (entrega) => {
    setEntregaSeleccionada(entrega);
    try {
      const response = await entregaService.obtenerTracking(entrega._id);
      if (response.success) {
        setTrackingData(response.data);
      }
    } catch (error) {
      console.error('Error obteniendo tracking:', error);
      setTrackingData(null);
    }
    setShowTrackingDialog(true);
  };

  const iniciarTrackingSimulado = async () => {
    if (!entregaSeleccionada) return;

    try {
      await entregaService.iniciarTracking(entregaSeleccionada._id);
      setSimulandoTracking(true);

      toast.current?.show({
        severity: 'success',
        summary: 'Tracking Iniciado',
        detail: 'Simulación de tracking en curso...',
        life: 3000,
      });

      // Iniciar intervalo para simular actualizaciones
      const intervalo = setInterval(
        async () => {
          try {
            const response = await entregaService.simularUbicacion(
              entregaSeleccionada._id,
            );
            if (response.success) {
              setTrackingData((prev) => ({
                ...prev,
                ubicacionActual: response.data.ubicacionActual,
                tracking: [...(prev?.tracking || []), response.data.tracking],
                progreso: response.data.progreso,
              }));

              // Si llegó al 100%, detener
              if (response.data.progreso >= 100) {
                clearInterval(intervalo);
                setSimulandoTracking(false);
                toast.current?.show({
                  severity: 'success',
                  summary: '¡Entrega Completada!',
                  detail: 'El vehículo ha llegado a su destino',
                  life: 5000,
                });
                cargarDatos();
              }
            }
          } catch (error) {
            console.error('Error simulando ubicación:', error);
          }
        },
        Math.random() * 3000 + 2000,
      ); // Entre 2 y 5 segundos aleatorio

      setIntervaloTracking(intervalo);
    } catch {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo iniciar el tracking',
        life: 3000,
      });
    }
  };

  const detenerTracking = () => {
    if (intervaloTracking) {
      clearInterval(intervaloTracking);
      setIntervaloTracking(null);
    }
    setSimulandoTracking(false);
  };

  const actualizarEstado = async (entrega, nuevoEstado) => {
    try {
      const response = await entregaService.actualizarEstado(entrega._id, {
        estado: nuevoEstado,
      });
      if (response.success) {
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: `Estado actualizado a ${nuevoEstado}`,
          life: 3000,
        });
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

  const completarEntrega = async (entrega) => {
    confirmDialog({
      message: '¿Confirmar que la entrega fue completada?',
      header: 'Completar Entrega',
      icon: 'pi pi-check-circle',
      accept: async () => {
        try {
          const response = await entregaService.completar(entrega._id, {});
          if (response.success) {
            toast.current?.show({
              severity: 'success',
              summary: 'Entrega Completada',
              detail: 'La entrega ha sido marcada como completada',
              life: 3000,
            });
            cargarDatos();
          }
        } catch {
          toast.current?.show({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo completar la entrega',
            life: 3000,
          });
        }
      },
    });
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
        icon: 'pi pi-spin pi-spinner',
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
      cancelado: {
        label: 'Cancelado',
        severity: 'secondary',
        icon: 'pi pi-times',
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

  const vehiculoTemplate = (rowData) => {
    if (!rowData.vehiculo) return 'N/A';
    return `${rowData.vehiculo.placa} - ${rowData.vehiculo.marca}`;
  };

  const accionesTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        {rowData.estado === 'pendiente' && (
          <Button
            icon="pi pi-play"
            rounded
            outlined
            severity="success"
            tooltip="Iniciar Entrega"
            onClick={() => actualizarEstado(rowData, 'en_proceso')}
          />
        )}
        {(rowData.estado === 'en_proceso' ||
          rowData.estado === 'pendiente') && (
          <Button
            icon="pi pi-map-marker"
            rounded
            outlined
            severity="info"
            tooltip="Ver Tracking"
            onClick={() => verTracking(rowData)}
          />
        )}
        {rowData.estado === 'en_proceso' && (
          <Button
            icon="pi pi-check-circle"
            rounded
            outlined
            severity="success"
            tooltip="Completar"
            onClick={() => completarEntrega(rowData)}
          />
        )}
        {rowData.estado !== 'entregado' && rowData.estado !== 'cancelado' && (
          <Button
            icon="pi pi-exclamation-triangle"
            rounded
            outlined
            severity="warning"
            tooltip="Marcar Retrasado"
            onClick={() => actualizarEstado(rowData, 'retrasado')}
          />
        )}
      </div>
    );
  };

  const leftToolbarTemplate = () => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-refresh"
          outlined
          onClick={cargarDatos}
          tooltip="Actualizar"
        />
      </div>
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
          placeholder="Buscar entregas..."
          style={{ width: '300px', paddingLeft: '36px' }}
        />
      </span>
    );
  };

  // Render del Timeline de tracking
  const renderTimelineTracking = () => {
    if (!trackingData?.tracking || trackingData.tracking.length === 0) {
      return (
        <p className="text-center">No hay datos de tracking disponibles</p>
      );
    }

    const eventos = trackingData.tracking.map((t, index) => ({
      status: `${t.porcentajeRecorrido?.toFixed(0) || 0}%`,
      date: new Date(t.fecha).toLocaleTimeString('es-EC'),
      icon:
        index === trackingData.tracking.length - 1
          ? 'pi pi-map-marker'
          : 'pi pi-circle-fill',
      color: index === trackingData.tracking.length - 1 ? '#22c55e' : '#3b82f6',
      ubicacion: t.nombreUbicacion,
      velocidad: t.velocidad,
    }));

    return (
      <Timeline
        value={eventos}
        opposite={(item) => item.date}
        content={(item) => (
          <div>
            <div className="font-semibold">{item.ubicacion}</div>
            <div className="text-sm text-500">
              Velocidad: {item.velocidad} km/h
            </div>
          </div>
        )}
        marker={(item) => (
          <span
            className="flex w-2rem h-2rem align-items-center justify-content-center text-white border-circle z-1 shadow-1"
            style={{ backgroundColor: item.color }}
          >
            <i className={item.icon}></i>
          </span>
        )}
      />
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
            Entregas y Seguimiento
          </h1>
          <p className="text-gray-600 mt-1">
            Gestión de entregas y tracking en tiempo real
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

      {/* Cards de estadísticas - Estilo Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Entregas
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {loading ? '...' : estadisticas.total}
              </p>
            </div>
            <div className="bg-blue-500 rounded-full p-3 text-white">
              <i className="pi pi-box text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En Proceso</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {loading ? '...' : estadisticas.en_proceso}
              </p>
            </div>
            <div className="bg-orange-500 rounded-full p-3 text-white">
              <i className="pi pi-spin pi-spinner text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Entregadas</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {loading ? '...' : estadisticas.entregadas}
              </p>
            </div>
            <div className="bg-green-500 rounded-full p-3 text-white">
              <i className="pi pi-check-circle text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Retrasadas</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {loading ? '...' : estadisticas.retrasadas}
              </p>
            </div>
            <div className="bg-red-500 rounded-full p-3 text-white">
              <i className="pi pi-exclamation-triangle text-xl"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          📦 Módulo de Entregas y Seguimiento
        </h2>
        <TabView
          activeIndex={activeTab}
          onTabChange={(e) => setActiveTab(e.index)}
        >
          {/* Tab de Entregas Activas */}
          <TabPanel header="Entregas Activas" leftIcon="pi pi-truck mr-2">
            <Toolbar
              left={leftToolbarTemplate}
              right={rightToolbarTemplate}
              className="mb-4"
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
              }}
            />

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
                header="Cliente"
                body={clienteTemplate}
                style={{ minWidth: '200px' }}
              />
              <Column
                header="Fecha Programada"
                body={fechaTemplate}
                sortable
                style={{ minWidth: '160px' }}
              />
              <Column
                header="Conductor"
                body={conductorTemplate}
                style={{ minWidth: '150px' }}
              />
              <Column
                header="Vehículo"
                body={vehiculoTemplate}
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

          {/* Tab de Tracking en Vivo */}
          <TabPanel header="Tracking en Vivo" leftIcon="pi pi-map-marker mr-2">
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  🚚 Entregas en Tránsito
                </h4>
                <DataTable
                  value={entregas.filter((e) => e.estado === 'en_proceso')}
                  loading={loading}
                  emptyMessage="No hay entregas en tránsito"
                  stripedRows
                  className="border border-gray-200 rounded-lg"
                >
                  <Column field="numeroEntrega" header="# Entrega" />
                  <Column header="Cliente" body={clienteTemplate} />
                  <Column header="Conductor" body={conductorTemplate} />
                  <Column header="Vehículo" body={vehiculoTemplate} />
                  <Column
                    header="Acción"
                    body={(rowData) => (
                      <Button
                        label="Ver Tracking"
                        icon="pi pi-map-marker"
                        onClick={() => verTracking(rowData)}
                      />
                    )}
                  />
                </DataTable>
              </div>
            </div>
          </TabPanel>

          {/* Tab de Historial */}
          <TabPanel header="Historial" leftIcon="pi pi-history mr-2">
            <div className="mb-4">
              <span className="mr-2 font-semibold text-gray-700">Periodo:</span>
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200 text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {historialData.estadisticas.tasaExito}%
                    </div>
                    <div className="text-gray-600 text-sm mt-1">
                      Tasa de Éxito
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {historialData.estadisticas.entregadas}
                    </div>
                    <div className="text-gray-600 text-sm mt-1">Entregadas</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4 border border-red-200 text-center">
                    <div className="text-3xl font-bold text-red-600">
                      {historialData.estadisticas.canceladas}
                    </div>
                    <div className="text-gray-600 text-sm mt-1">Canceladas</div>
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
        </TabView>
      </div>

      {/* Dialog de Tracking */}
      <Dialog
        visible={showTrackingDialog}
        onHide={() => {
          setShowTrackingDialog(false);
          detenerTracking();
        }}
        header={`Tracking - ${entregaSeleccionada?.numeroEntrega || ''}`}
        modal
        style={{ width: '800px' }}
        className="p-fluid"
      >
        {entregaSeleccionada && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Info de la entrega */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                📋 Información de Entrega
              </h4>
              <div className="space-y-3">
                <div>
                  <span className="font-semibold text-gray-700">Cliente:</span>{' '}
                  <span className="text-gray-900">
                    {entregaSeleccionada.cliente?.nombre}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Destino:</span>{' '}
                  <span className="text-gray-900">
                    {entregaSeleccionada.cliente?.direccion}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">
                    Conductor:
                  </span>{' '}
                  <span className="text-gray-900">
                    {entregaSeleccionada.conductor?.nombre}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Vehículo:</span>{' '}
                  <span className="text-gray-900">
                    {entregaSeleccionada.vehiculo?.placa} -{' '}
                    {entregaSeleccionada.vehiculo?.marca}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Estado:</span>{' '}
                  {estadoTemplate(entregaSeleccionada)}
                </div>
              </div>
            </div>

            {/* Progreso y ubicación actual */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                📍 Ubicación Actual
              </h4>
              {trackingData?.ubicacionActual ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <i className="pi pi-map-marker text-blue-500"></i>
                    <strong className="text-gray-900">
                      {trackingData.ubicacionActual.nombreUbicacion}
                    </strong>
                  </div>
                  <div className="text-sm text-gray-500">
                    Última actualización:{' '}
                    {new Date(
                      trackingData.ubicacionActual.ultimaActualizacion,
                    ).toLocaleTimeString()}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">
                      Progreso:
                    </span>
                    <ProgressBar
                      value={trackingData.progreso || 0}
                      className="mt-2"
                      style={{ height: '20px' }}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-center text-gray-500">
                  Sin datos de ubicación
                </p>
              )}

              <Divider />

              <div className="flex gap-2 justify-center">
                {!simulandoTracking ? (
                  <Button
                    label="Iniciar Simulación"
                    icon="pi pi-play"
                    severity="success"
                    onClick={iniciarTrackingSimulado}
                    disabled={entregaSeleccionada.estado === 'entregado'}
                  />
                ) : (
                  <Button
                    label="Detener Simulación"
                    icon="pi pi-stop"
                    severity="danger"
                    onClick={detenerTracking}
                  />
                )}
              </div>

              {simulandoTracking && (
                <div className="mt-3 text-center">
                  <i className="pi pi-spin pi-spinner mr-2"></i>
                  <span className="text-blue-600">
                    Simulando movimiento del vehículo...
                  </span>
                </div>
              )}
            </div>

            {/* Timeline de tracking */}
            <div className="md:col-span-2 bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                🛤️ Historial de Ubicaciones
              </h4>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {renderTimelineTracking()}
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}

export default Entregas;
