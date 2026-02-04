import { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Message } from 'primereact/message';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Toolbar } from 'primereact/toolbar';
import { Tag } from 'primereact/tag';
import { useRef } from 'react';
import { productoService, usuarioService } from '../services';
import api from '../services/api';

function Rutas() {
  const toast = useRef(null);

  // Estados del formulario
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [productos, setProductos] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [conductores, setConductores] = useState([]);
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);

  // Datos del formulario
  const [formData, setFormData] = useState({
    origen: {
      nombre: '',
      direccion: '',
      latitud: '',
      longitud: '',
    },
    destino: {
      nombre: '',
      direccion: '',
      latitud: '',
      longitud: '',
      contacto: {
        nombre: '',
        telefono: '',
        email: '',
      },
    },
    fecha_programada: null,
    vehiculo: null,
    conductor: null,
    observaciones: '',
    distancia_estimada: 0,
    tiempo_estimado: 0,
  });

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  const cargarDatosIniciales = async () => {
    setLoading(true);
    try {
      // Cargar productos
      const respProductos = await productoService.obtenerTodos({
        activo: true,
        limit: 100,
      });
      if (respProductos.success) {
        setProductos(respProductos.data.productos);
      }

      // Cargar conductores
      const respConductores =
        await usuarioService.obtenerConductoresDisponibles();
      if (respConductores.success) {
        setConductores(respConductores.data.conductores);
      }

      // Cargar vehículos (simulado - ajustar cuando tengas el endpoint)
      const respVehiculos = await api.get('/vehiculos?estado=disponible');
      if (respVehiculos.data.success) {
        setVehiculos(respVehiculos.data.data.vehiculos);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar los datos iniciales',
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogoCrear = () => {
    resetFormulario();
    setShowDialog(true);
  };

  const resetFormulario = () => {
    setFormData({
      origen: {
        nombre: '',
        direccion: '',
        latitud: '',
        longitud: '',
      },
      destino: {
        nombre: '',
        direccion: '',
        latitud: '',
        longitud: '',
        contacto: {
          nombre: '',
          telefono: '',
          email: '',
        },
      },
      fecha_programada: null,
      vehiculo: null,
      conductor: null,
      observaciones: '',
      distancia_estimada: 0,
      tiempo_estimado: 0,
    });
    setProductosSeleccionados([]);
  };

  const handleSubmit = async () => {
    // Validaciones
    if (!formData.origen.nombre || !formData.origen.direccion) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Complete los datos del origen',
        life: 3000,
      });
      return;
    }

    if (!formData.destino.nombre || !formData.destino.direccion) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Complete los datos del destino',
        life: 3000,
      });
      return;
    }

    if (!formData.vehiculo) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Seleccione un vehículo',
        life: 3000,
      });
      return;
    }

    if (!formData.conductor) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Seleccione un conductor',
        life: 3000,
      });
      return;
    }

    if (!formData.fecha_programada) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Seleccione la fecha programada',
        life: 3000,
      });
      return;
    }

    if (productosSeleccionados.length === 0) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Seleccione al menos un producto',
        life: 3000,
      });
      return;
    }

    // Confirmar creación
    confirmDialog({
      message: '¿Está seguro de crear esta ruta?',
      header: 'Confirmar Creación',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        setLoading(true);
        try {
          // Preparar datos para enviar
          const rutaData = {
            origen: {
              nombre: formData.origen.nombre,
              direccion: formData.origen.direccion,
              coordenadas: {
                latitud: parseFloat(formData.origen.latitud) || 0,
                longitud: parseFloat(formData.origen.longitud) || 0,
              },
            },
            destino: {
              nombre: formData.destino.nombre,
              direccion: formData.destino.direccion,
              coordenadas: {
                latitud: parseFloat(formData.destino.latitud) || 0,
                longitud: parseFloat(formData.destino.longitud) || 0,
              },
              contacto: {
                nombre: formData.destino.contacto.nombre,
                telefono: formData.destino.contacto.telefono,
                email: formData.destino.contacto.email,
              },
            },
            fecha_programada: formData.fecha_programada,
            vehiculo: formData.vehiculo._id,
            conductor: formData.conductor._id,
            lista_productos: productosSeleccionados.map((p) => ({
              producto: p._id,
              cantidad: p.cantidadRuta || 1,
            })),
            observaciones: formData.observaciones,
            distancia_km: formData.distancia_estimada,
            tiempo_estimado_horas: formData.tiempo_estimado,
          };

          const response = await api.post('/rutas', rutaData);

          if (response.data.success) {
            toast.current?.show({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Ruta creada exitosamente',
              life: 3000,
            });
            setShowDialog(false);
            resetFormulario();
            // Aquí podrías recargar la lista de rutas
          }
        } catch (error) {
          console.error('Error creando ruta:', error);
          toast.current?.show({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data?.message || 'No se pudo crear la ruta',
            life: 4000,
          });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // Templates para las columnas de productos
  const nombreProductoTemplate = (rowData) => {
    return (
      <div>
        <div
          className="font-semibold"
          style={{ color: 'var(--color-secondary)' }}
        >
          {rowData.nombre}
        </div>
        <div className="text-sm text-500">{rowData.codigo}</div>
      </div>
    );
  };

  const stockTemplate = (rowData) => {
    return (
      <div className="flex align-items-center gap-2">
        <span>{rowData.stock_actual}</span>
        <span className="text-500">{rowData.unidadMedida}</span>
      </div>
    );
  };

  const cantidadTemplate = (rowData) => {
    return (
      <InputNumber
        value={rowData.cantidadRuta || 1}
        onValueChange={(e) => {
          const updatedProductos = productosSeleccionados.map((p) =>
            p._id === rowData._id ? { ...p, cantidadRuta: e.value } : p,
          );
          setProductosSeleccionados(updatedProductos);
        }}
        min={1}
        max={rowData.stock_actual}
        showButtons
        buttonLayout="horizontal"
        decrementButtonClassName="p-button-outlined"
        incrementButtonClassName="p-button-outlined"
      />
    );
  };

  const bodegaTemplate = (rowData) => {
    return rowData.bodega?.nombre || 'N/A';
  };

  // Estado para la lista de rutas
  const [rutas, setRutas] = useState([]);
  const [loadingRutas, setLoadingRutas] = useState(false);
  const [showTrackingDialog, setShowTrackingDialog] = useState(false);
  const [rutaSeleccionada, setRutaSeleccionada] = useState(null);
  const [trackingData, setTrackingData] = useState([]);
  const [simulandoTracking, setSimulandoTracking] = useState(false);
  const [intervaloTracking, setIntervaloTracking] = useState(null);

  // Cargar lista de rutas
  const cargarRutas = async () => {
    setLoadingRutas(true);
    try {
      const response = await api.get('/rutas?limit=50');
      if (response.data.success) {
        setRutas(response.data.data.rutas);
      }
    } catch (error) {
      console.error('Error cargando rutas:', error);
    } finally {
      setLoadingRutas(false);
    }
  };

  useEffect(() => {
    cargarRutas();
  }, []);

  // Templates para la tabla de rutas
  const estadoRutaTemplate = (rowData) => {
    const estados = {
      planificada: { label: 'Planificada', severity: 'info' },
      en_transito: { label: 'En Tránsito', severity: 'warning' },
      completada: { label: 'Completada', severity: 'success' },
      cancelada: { label: 'Cancelada', severity: 'danger' },
    };
    const estado = estados[rowData.estado] || {
      label: rowData.estado,
      severity: 'info',
    };
    return <Tag value={estado.label} severity={estado.severity} />;
  };

  const fechaTemplate = (rowData) => {
    if (!rowData.fecha_programada) return 'N/A';
    return new Date(rowData.fecha_programada).toLocaleString('es-CO', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  };

  const conductorRutaTemplate = (rowData) => {
    return rowData.conductor?.nombre || 'Sin asignar';
  };

  const vehiculoRutaTemplate = (rowData) => {
    if (!rowData.vehiculo) return 'N/A';
    return `${rowData.vehiculo.placa} - ${rowData.vehiculo.marca}`;
  };

  const accionesRutaTemplate = (rowData) => {
    return (
      <div className="flex gap-2">
        {rowData.estado === 'planificada' && (
          <Button
            icon="pi pi-play"
            rounded
            outlined
            severity="success"
            tooltip="Iniciar Ruta"
            onClick={() => iniciarRutaHandler(rowData)}
          />
        )}
        {rowData.estado === 'en_transito' && (
          <>
            <Button
              icon="pi pi-map-marker"
              rounded
              outlined
              severity="info"
              tooltip="Ver Tracking"
              onClick={() => verTracking(rowData)}
            />
            <Button
              icon="pi pi-check-circle"
              rounded
              outlined
              severity="success"
              tooltip="Completar Ruta"
              onClick={() => completarRutaHandler(rowData)}
            />
          </>
        )}
        {rowData.estado !== 'completada' && rowData.estado !== 'cancelada' && (
          <Button
            icon="pi pi-times"
            rounded
            outlined
            severity="danger"
            tooltip="Cancelar Ruta"
            onClick={() => cancelarRutaHandler(rowData)}
          />
        )}
      </div>
    );
  };

  const iniciarRutaHandler = async (ruta) => {
    try {
      const response = await api.post(`/rutas/${ruta._id}/iniciar`);
      if (response.data.success) {
        toast.current?.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Ruta iniciada correctamente',
          life: 3000,
        });
        cargarRutas();
      }
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data?.message || 'No se pudo iniciar la ruta',
        life: 3000,
      });
    }
  };

  const completarRutaHandler = async (ruta) => {
    confirmDialog({
      message:
        '¿Está seguro de completar esta ruta? Se creará automáticamente un registro de entrega.',
      header: 'Confirmar',
      icon: 'pi pi-check-circle',
      accept: async () => {
        try {
          const response = await api.patch(`/rutas/${ruta._id}/estado`, {
            estado: 'completada',
          });
          if (response.data.success) {
            toast.current?.show({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Ruta completada y entrega registrada correctamente',
              life: 3000,
            });
            cargarRutas();
          }
        } catch (error) {
          toast.current?.show({
            severity: 'error',
            summary: 'Error',
            detail:
              error.response?.data?.message || 'No se pudo completar la ruta',
            life: 3000,
          });
        }
      },
    });
  };

  const cancelarRutaHandler = async (ruta) => {
    confirmDialog({
      message: '¿Está seguro de cancelar esta ruta?',
      header: 'Confirmar Cancelación',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          const response = await api.patch(`/rutas/${ruta._id}/estado`, {
            estado: 'cancelada',
            motivo_cancelacion: 'Cancelada por el usuario',
          });
          if (response.data.success) {
            toast.current?.show({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Ruta cancelada',
              life: 3000,
            });
            cargarRutas();
          }
        } catch (error) {
          toast.current?.show({
            severity: 'error',
            summary: 'Error',
            detail:
              error.response?.data?.message || 'No se pudo cancelar la ruta',
            life: 3000,
          });
        }
      },
    });
  };

  const verTracking = async (ruta) => {
    setRutaSeleccionada(ruta);
    try {
      const response = await api.get(`/rutas/${ruta._id}/tracking`);
      if (response.data.success) {
        setTrackingData(response.data.data.tracking || []);
      }
    } catch (error) {
      console.error('Error obteniendo tracking:', error);
      setTrackingData([]);
    }
    setShowTrackingDialog(true);
  };

  // Simular actualización de tracking para rutas en tránsito
  const simularTracking = async () => {
    if (!rutaSeleccionada || rutaSeleccionada.estado !== 'en_transito') return;

    try {
      const response = await api.post(
        `/rutas/${rutaSeleccionada._id}/tracking`,
        {
          latitud: -0.2 + (Math.random() * 2 - 1),
          longitud: -78.5 + (Math.random() * 2 - 1),
          velocidad: Math.floor(Math.random() * 60) + 20,
          observacion: `Actualización simulada - ${new Date().toLocaleTimeString()}`,
        },
      );

      if (response.data.success) {
        // Recargar tracking
        const trackingResp = await api.get(
          `/rutas/${rutaSeleccionada._id}/tracking`,
        );
        if (trackingResp.data.success) {
          setTrackingData(trackingResp.data.data.tracking || []);
        }
      }
    } catch (error) {
      console.error('Error simulando tracking:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo actualizar el tracking',
        life: 3000,
      });
    }
  };

  const iniciarSimulacionTracking = () => {
    setSimulandoTracking(true);
    toast.current?.show({
      severity: 'success',
      summary: 'Simulación Iniciada',
      detail: 'Simulando movimiento del vehículo...',
      life: 3000,
    });

    // Hacer una actualización inmediata
    simularTracking();

    // Iniciar intervalo para actualizaciones periódicas
    const intervalo = setInterval(() => {
      simularTracking();
    }, 5000); // Cada 5 segundos

    setIntervaloTracking(intervalo);
  };

  const detenerSimulacionTracking = () => {
    if (intervaloTracking) {
      clearInterval(intervaloTracking);
      setIntervaloTracking(null);
    }
    setSimulandoTracking(false);
    toast.current?.show({
      severity: 'info',
      summary: 'Simulación Detenida',
      detail: 'La simulación ha sido detenida',
      life: 3000,
    });
  };

  // Limpiar intervalo al cerrar el diálogo
  const cerrarDialogoTracking = () => {
    detenerSimulacionTracking();
    setShowTrackingDialog(false);
  };

  return (
    <div className="p-4">
      <Toast ref={toast} />
      <ConfirmDialog />

      <Card
        title="Gestión de Rutas y Entregas"
        className="shadow-lg mb-4"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <Toolbar
          left={() => (
            <Button
              label="Nueva Ruta"
              icon="pi pi-plus"
              severity="success"
              onClick={abrirDialogoCrear}
            />
          )}
          right={() => (
            <Button
              icon="pi pi-refresh"
              outlined
              onClick={cargarRutas}
              tooltip="Actualizar"
            />
          )}
          className="mb-4"
          style={{
            backgroundColor: 'var(--color-accent)',
            border: '1px solid var(--color-border)',
          }}
        />

        <DataTable
          value={rutas}
          loading={loadingRutas}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          emptyMessage="No hay rutas registradas"
          stripedRows
          style={{ border: '1px solid var(--color-border)' }}
        >
          <Column
            field="numeroRuta"
            header="# Ruta"
            sortable
            style={{ minWidth: '120px' }}
          />
          <Column
            field="origen.nombre"
            header="Origen"
            sortable
            style={{ minWidth: '150px' }}
          />
          <Column
            field="destino.nombre"
            header="Destino"
            sortable
            style={{ minWidth: '150px' }}
          />
          <Column
            header="Fecha Programada"
            body={fechaTemplate}
            sortable
            style={{ minWidth: '160px' }}
          />
          <Column
            header="Conductor"
            body={conductorRutaTemplate}
            style={{ minWidth: '150px' }}
          />
          <Column
            header="Vehículo"
            body={vehiculoRutaTemplate}
            style={{ minWidth: '150px' }}
          />
          <Column
            header="Estado"
            body={estadoRutaTemplate}
            sortable
            style={{ minWidth: '120px' }}
          />
          <Column
            header="Acciones"
            body={accionesRutaTemplate}
            style={{ minWidth: '180px' }}
          />
        </DataTable>
      </Card>

      {/* Dialog de Tracking Mejorado */}
      <Dialog
        header={`Tracking - Ruta ${rutaSeleccionada?.numeroRuta || ''}`}
        visible={showTrackingDialog}
        style={{ width: '700px' }}
        onHide={cerrarDialogoTracking}
        modal
      >
        {rutaSeleccionada && (
          <div className="space-y-4">
            {/* Información de la ruta */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div>
                <p className="text-sm text-gray-500">Origen</p>
                <p className="font-semibold">
                  {rutaSeleccionada.origen?.nombre}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Destino</p>
                <p className="font-semibold">
                  {rutaSeleccionada.destino?.nombre}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Conductor</p>
                <p className="font-semibold">
                  {rutaSeleccionada.conductor?.nombre || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Vehículo</p>
                <p className="font-semibold">
                  {rutaSeleccionada.vehiculo?.placa || 'N/A'}
                </p>
              </div>
            </div>

            {/* Botones de simulación - Solo para rutas en tránsito */}
            {rutaSeleccionada.estado === 'en_transito' && (
              <div className="flex gap-2 justify-center">
                {!simulandoTracking ? (
                  <Button
                    label="Iniciar Simulación de Tracking"
                    icon="pi pi-play"
                    severity="success"
                    onClick={iniciarSimulacionTracking}
                  />
                ) : (
                  <Button
                    label="Detener Simulación"
                    icon="pi pi-stop"
                    severity="danger"
                    onClick={detenerSimulacionTracking}
                  />
                )}
                <Button
                  label="Actualizar Manualmente"
                  icon="pi pi-refresh"
                  outlined
                  onClick={simularTracking}
                  disabled={simulandoTracking}
                />
              </div>
            )}

            {simulandoTracking && (
              <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                <i className="pi pi-spin pi-spinner mr-2 text-blue-500"></i>
                <span className="text-blue-700">
                  Simulando movimiento del vehículo cada 5 segundos...
                </span>
              </div>
            )}

            {/* Lista de puntos de tracking */}
            <div className="border rounded-lg max-h-80 overflow-y-auto">
              <div className="p-3 bg-gray-100 border-b font-semibold sticky top-0">
                📍 Historial de Ubicaciones ({trackingData.length} puntos)
              </div>
              {trackingData.length > 0 ? (
                <div className="divide-y">
                  {trackingData
                    .slice()
                    .reverse()
                    .map((punto, index) => (
                      <div key={index} className="p-3 hover:bg-gray-50">
                        <div className="flex justify-between items-center mb-1">
                          <Tag
                            value={
                              index === 0
                                ? 'Última ubicación'
                                : `Punto ${trackingData.length - index}`
                            }
                            severity={index === 0 ? 'success' : 'info'}
                            className="text-xs"
                          />
                          <span className="text-xs text-gray-500">
                            {new Date(punto.fecha).toLocaleString('es-EC')}
                          </span>
                        </div>
                        <div className="text-sm">
                          <p>
                            <strong>Lat:</strong> {punto.latitud?.toFixed(6)} |{' '}
                            <strong>Lng:</strong> {punto.longitud?.toFixed(6)}
                          </p>
                          {punto.velocidad > 0 && (
                            <p>
                              <strong>Velocidad:</strong> {punto.velocidad} km/h
                            </p>
                          )}
                          {punto.observacion && (
                            <p className="text-gray-600">
                              <strong>Obs:</strong> {punto.observacion}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <i className="pi pi-map-marker text-4xl text-gray-400 mb-3"></i>
                  <p className="text-gray-500">
                    No hay datos de tracking disponibles
                  </p>
                  {rutaSeleccionada.estado === 'en_transito' && (
                    <p className="text-sm text-gray-400 mt-2">
                      Inicie la simulación para generar puntos de tracking
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </Dialog>

      {/* Dialog para crear ruta */}
      <Dialog
        header="Crear Nueva Ruta"
        visible={showDialog}
        style={{ width: '90vw', maxWidth: '1200px' }}
        onHide={() => setShowDialog(false)}
        maximizable
        modal
      >
        <div className="grid">
          {/* Columna Izquierda - Información General */}
          <div className="col-12 lg:col-6">
            <Card
              title="Información de Origen"
              className="mb-3"
              style={{
                backgroundColor: 'var(--color-accent)',
                border: '1px solid var(--color-border)',
              }}
            >
              <div className="flex flex-column gap-3">
                <div className="flex flex-column gap-2">
                  <label
                    htmlFor="origen-nombre"
                    className="font-semibold"
                    style={{ color: 'var(--color-secondary)' }}
                  >
                    Nombre del Lugar
                  </label>
                  <InputText
                    id="origen-nombre"
                    value={formData.origen.nombre}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        origen: { ...formData.origen, nombre: e.target.value },
                      })
                    }
                    placeholder="Ej: Bodega Central"
                  />
                </div>

                <div className="flex flex-column gap-2">
                  <label
                    htmlFor="origen-direccion"
                    className="font-semibold"
                    style={{ color: 'var(--color-secondary)' }}
                  >
                    Dirección
                  </label>
                  <InputTextarea
                    id="origen-direccion"
                    value={formData.origen.direccion}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        origen: {
                          ...formData.origen,
                          direccion: e.target.value,
                        },
                      })
                    }
                    rows={2}
                    placeholder="Dirección completa del origen"
                  />
                </div>

                <div className="grid">
                  <div className="col-6">
                    <label
                      className="font-semibold"
                      style={{ color: 'var(--color-secondary)' }}
                    >
                      Latitud
                    </label>
                    <InputText
                      value={formData.origen.latitud}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          origen: {
                            ...formData.origen,
                            latitud: e.target.value,
                          },
                        })
                      }
                      placeholder="0.000000"
                    />
                  </div>
                  <div className="col-6">
                    <label
                      className="font-semibold"
                      style={{ color: 'var(--color-secondary)' }}
                    >
                      Longitud
                    </label>
                    <InputText
                      value={formData.origen.longitud}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          origen: {
                            ...formData.origen,
                            longitud: e.target.value,
                          },
                        })
                      }
                      placeholder="0.000000"
                    />
                  </div>
                </div>
              </div>
            </Card>

            <Card
              title="Información de Destino"
              className="mb-3"
              style={{
                backgroundColor: 'var(--color-accent)',
                border: '1px solid var(--color-border)',
              }}
            >
              <div className="flex flex-column gap-3">
                <div className="flex flex-column gap-2">
                  <label
                    htmlFor="destino-nombre"
                    className="font-semibold"
                    style={{ color: 'var(--color-secondary)' }}
                  >
                    Nombre del Lugar
                  </label>
                  <InputText
                    id="destino-nombre"
                    value={formData.destino.nombre}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        destino: {
                          ...formData.destino,
                          nombre: e.target.value,
                        },
                      })
                    }
                    placeholder="Ej: Cliente ABC"
                  />
                </div>

                <div className="flex flex-column gap-2">
                  <label
                    htmlFor="destino-direccion"
                    className="font-semibold"
                    style={{ color: 'var(--color-secondary)' }}
                  >
                    Dirección
                  </label>
                  <InputTextarea
                    id="destino-direccion"
                    value={formData.destino.direccion}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        destino: {
                          ...formData.destino,
                          direccion: e.target.value,
                        },
                      })
                    }
                    rows={2}
                    placeholder="Dirección completa del destino"
                  />
                </div>

                <div className="grid">
                  <div className="col-6">
                    <label
                      className="font-semibold"
                      style={{ color: 'var(--color-secondary)' }}
                    >
                      Latitud
                    </label>
                    <InputText
                      value={formData.destino.latitud}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          destino: {
                            ...formData.destino,
                            latitud: e.target.value,
                          },
                        })
                      }
                      placeholder="0.000000"
                    />
                  </div>
                  <div className="col-6">
                    <label
                      className="font-semibold"
                      style={{ color: 'var(--color-secondary)' }}
                    >
                      Longitud
                    </label>
                    <InputText
                      value={formData.destino.longitud}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          destino: {
                            ...formData.destino,
                            longitud: e.target.value,
                          },
                        })
                      }
                      placeholder="0.000000"
                    />
                  </div>
                </div>

                <div className="flex flex-column gap-2">
                  <label
                    className="font-semibold"
                    style={{ color: 'var(--color-secondary)' }}
                  >
                    Contacto en Destino (Opcional)
                  </label>
                  <InputText
                    value={formData.destino.contacto.nombre}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        destino: {
                          ...formData.destino,
                          contacto: {
                            ...formData.destino.contacto,
                            nombre: e.target.value,
                          },
                        },
                      })
                    }
                    placeholder="Nombre del contacto"
                    className="mb-2"
                  />
                  <InputText
                    value={formData.destino.contacto.telefono}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        destino: {
                          ...formData.destino,
                          contacto: {
                            ...formData.destino.contacto,
                            telefono: e.target.value,
                          },
                        },
                      })
                    }
                    placeholder="Teléfono"
                    className="mb-2"
                  />
                  <InputText
                    value={formData.destino.contacto.email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        destino: {
                          ...formData.destino,
                          contacto: {
                            ...formData.destino.contacto,
                            email: e.target.value,
                          },
                        },
                      })
                    }
                    placeholder="Email"
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Columna Derecha - Asignación y Productos */}
          <div className="col-12 lg:col-6">
            <Card
              title="Asignación de Recursos"
              className="mb-3"
              style={{
                backgroundColor: 'var(--color-accent)',
                border: '1px solid var(--color-border)',
              }}
            >
              <div className="flex flex-column gap-3">
                <div className="flex flex-column gap-2">
                  <label
                    htmlFor="vehiculo"
                    className="font-semibold"
                    style={{ color: 'var(--color-secondary)' }}
                  >
                    <i className="pi pi-car mr-2"></i>
                    Vehículo *
                  </label>
                  <Dropdown
                    id="vehiculo"
                    value={formData.vehiculo}
                    options={vehiculos}
                    onChange={(e) =>
                      setFormData({ ...formData, vehiculo: e.value })
                    }
                    optionLabel="placa"
                    placeholder="Seleccione un vehículo"
                    filter
                    showClear
                    emptyMessage="No hay vehículos disponibles"
                    itemTemplate={(option) => (
                      <div className="flex align-items-center gap-2">
                        <i className="pi pi-car"></i>
                        <div>
                          <div
                            className="font-semibold"
                            style={{ color: 'var(--color-secondary)' }}
                          >
                            {option.placa}
                          </div>
                          <div className="text-sm text-500">
                            {option.marca} {option.modelo} - {option.tipo}
                          </div>
                        </div>
                      </div>
                    )}
                  />
                </div>

                <div className="flex flex-column gap-2">
                  <label
                    htmlFor="conductor"
                    className="font-semibold"
                    style={{ color: 'var(--color-secondary)' }}
                  >
                    <i className="pi pi-user mr-2"></i>
                    Conductor *
                  </label>
                  <Dropdown
                    id="conductor"
                    value={formData.conductor}
                    options={conductores}
                    onChange={(e) =>
                      setFormData({ ...formData, conductor: e.value })
                    }
                    optionLabel="nombre"
                    placeholder="Seleccione un conductor"
                    filter
                    showClear
                    emptyMessage="No hay conductores disponibles"
                    itemTemplate={(option) => (
                      <div className="flex align-items-center gap-2">
                        <i className="pi pi-user"></i>
                        <div>
                          <div
                            className="font-semibold"
                            style={{ color: 'var(--color-secondary)' }}
                          >
                            {option.nombre}
                          </div>
                          <div className="text-sm text-500">{option.email}</div>
                        </div>
                      </div>
                    )}
                  />
                </div>

                <div className="flex flex-column gap-2">
                  <label
                    htmlFor="fecha"
                    className="font-semibold"
                    style={{ color: 'var(--color-secondary)' }}
                  >
                    <i className="pi pi-calendar mr-2"></i>
                    Fecha Programada *
                  </label>
                  <Calendar
                    id="fecha"
                    value={formData.fecha_programada}
                    onChange={(e) =>
                      setFormData({ ...formData, fecha_programada: e.value })
                    }
                    showTime
                    hourFormat="24"
                    dateFormat="dd/mm/yy"
                    placeholder="Seleccione fecha y hora"
                    showIcon
                    minDate={new Date()}
                  />
                </div>

                <div className="grid">
                  <div className="col-6">
                    <label
                      className="font-semibold"
                      style={{ color: 'var(--color-secondary)' }}
                    >
                      Distancia (km)
                    </label>
                    <InputNumber
                      value={formData.distancia_estimada}
                      onValueChange={(e) =>
                        setFormData({
                          ...formData,
                          distancia_estimada: e.value,
                        })
                      }
                      min={0}
                      suffix=" km"
                    />
                  </div>
                  <div className="col-6">
                    <label
                      className="font-semibold"
                      style={{ color: 'var(--color-secondary)' }}
                    >
                      Tiempo (min)
                    </label>
                    <InputNumber
                      value={formData.tiempo_estimado}
                      onValueChange={(e) =>
                        setFormData({ ...formData, tiempo_estimado: e.value })
                      }
                      min={0}
                      suffix=" min"
                    />
                  </div>
                </div>

                <div className="flex flex-column gap-2">
                  <label
                    htmlFor="observaciones"
                    className="font-semibold"
                    style={{ color: 'var(--color-secondary)' }}
                  >
                    Observaciones
                  </label>
                  <InputTextarea
                    id="observaciones"
                    value={formData.observaciones}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        observaciones: e.target.value,
                      })
                    }
                    rows={3}
                    placeholder="Observaciones adicionales..."
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Productos - Ancho Completo */}
          <div className="col-12">
            <Card
              title="Productos a Transportar"
              className="mb-3"
              style={{
                backgroundColor: 'var(--color-accent)',
                border: '1px solid var(--color-border)',
              }}
            >
              <Message
                severity="info"
                text="Seleccione los productos y defina las cantidades a transportar en esta ruta"
                className="mb-3"
              />

              <DataTable
                value={productos}
                selection={productosSeleccionados}
                onSelectionChange={(e) => setProductosSeleccionados(e.value)}
                dataKey="_id"
                paginator
                rows={5}
                rowsPerPageOptions={[5, 10, 25]}
                emptyMessage="No hay productos disponibles"
                loading={loading}
                stripedRows
                selectionMode="checkbox"
              >
                <Column
                  selectionMode="multiple"
                  headerStyle={{ width: '3rem' }}
                />
                <Column
                  field="nombre"
                  header="Producto"
                  body={nombreProductoTemplate}
                  sortable
                />
                <Column field="categoria" header="Categoría" sortable />
                <Column
                  field="stock_actual"
                  header="Stock Disponible"
                  body={stockTemplate}
                  sortable
                />
                <Column
                  field="bodega"
                  header="Bodega"
                  body={bodegaTemplate}
                  sortable
                />
                <Column
                  header="Cantidad a Transportar"
                  body={cantidadTemplate}
                  style={{ width: '200px' }}
                />
              </DataTable>

              {productosSeleccionados.length > 0 && (
                <div
                  className="mt-3 p-3 border-round"
                  style={{
                    backgroundColor: 'var(--color-accent)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <strong style={{ color: 'var(--color-secondary)' }}>
                    Resumen:
                  </strong>{' '}
                  {productosSeleccionados.length} producto(s) seleccionado(s)
                  <div
                    className="text-sm mt-1"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    Total de unidades:{' '}
                    {productosSeleccionados.reduce(
                      (sum, p) => sum + (p.cantidadRuta || 1),
                      0,
                    )}
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Botones del Dialog */}
        <div className="flex justify-content-end gap-2 mt-3">
          <Button
            label="Cancelar"
            icon="pi pi-times"
            outlined
            onClick={() => setShowDialog(false)}
            disabled={loading}
          />
          <Button
            label="Crear Ruta"
            icon="pi pi-check"
            onClick={handleSubmit}
            loading={loading}
            disabled={loading}
          />
        </div>
      </Dialog>
    </div>
  );
}

export default Rutas;
