import { useState, useEffect, useRef } from 'react';
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
import { productoService } from '../services';
import api from '../services/api';

function Rutas() {
  const toast = useRef(null);

  // Estados del formulario principal
  const [showDialog, setShowDialog] = useState(false);
  const [showProductosDialog, setShowProductosDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [productos, setProductos] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [bodegas, setBodegas] = useState([]);
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);

  // Datos del formulario
  const [formData, setFormData] = useState({
    bodegaOrigen: null,
    destino: {
      nombre: '',
      direccion: '',
      contacto: {
        nombre: '',
        telefono: '',
        email: '',
      },
    },
    fecha_programada: null,
    vehiculo: null,
    observaciones: '',
    prioridad: 'media',
  });

  // Opciones de prioridad
  const prioridadOptions = [
    { label: 'Baja', value: 'baja' },
    { label: 'Media', value: 'media' },
    { label: 'Alta', value: 'alta' },
    { label: 'Urgente', value: 'urgente' },
  ];

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

      // Cargar bodegas
      const respBodegas = await api.get('/bodegas?estado=activa&limit=100');
      if (respBodegas.data.success) {
        setBodegas(respBodegas.data.data.bodegas);
      }

      // Cargar vehículos disponibles (que tengan conductor asignado)
      const respVehiculos = await api.get('/vehiculos?estado=disponible');
      if (respVehiculos.data.success) {
        // Solo mostrar vehículos que tengan conductor asignado
        const vehiculosConConductor = respVehiculos.data.data.vehiculos.filter(
          (v) => v.conductor_asignado,
        );
        setVehiculos(vehiculosConConductor);
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
      bodegaOrigen: null,
      destino: {
        nombre: '',
        direccion: '',
        contacto: {
          nombre: '',
          telefono: '',
          email: '',
        },
      },
      fecha_programada: null,
      vehiculo: null,
      observaciones: '',
      prioridad: 'media',
    });
    setProductosSeleccionados([]);
  };

  const abrirDialogoProductos = () => {
    setShowProductosDialog(true);
  };

  const handleSubmit = async () => {
    // Validaciones
    if (!formData.bodegaOrigen) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Seleccione una bodega de origen',
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
          // Construir dirección completa de la bodega
          const bodega = formData.bodegaOrigen;
          const direccionBodega = bodega.direccion
            ? `${bodega.direccion.calle}, ${bodega.direccion.ciudad}, ${bodega.direccion.estado}`
            : '';

          // Preparar datos para enviar
          const rutaData = {
            origen: {
              nombre: bodega.nombre,
              direccion: direccionBodega,
              coordenadas: {
                latitud: 0,
                longitud: 0,
              },
            },
            destino: {
              nombre: formData.destino.nombre,
              direccion: formData.destino.direccion,
              coordenadas: {
                latitud: 0,
                longitud: 0,
              },
              contacto: {
                nombre: formData.destino.contacto.nombre,
                telefono: formData.destino.contacto.telefono,
                email: formData.destino.contacto.email,
              },
            },
            fecha_programada: formData.fecha_programada,
            vehiculo: formData.vehiculo._id,
            conductor: formData.vehiculo.conductor_asignado._id,
            lista_productos: productosSeleccionados.map((p) => ({
              producto: p._id,
              cantidad: p.cantidadRuta || 1,
            })),
            observaciones: formData.observaciones,
            prioridad: formData.prioridad,
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
            cargarRutas();
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
    return new Date(rowData.fecha_programada).toLocaleString('es-EC', {
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

  const prioridadTemplate = (rowData) => {
    const prioridades = {
      baja: { label: 'Baja', severity: 'secondary' },
      media: { label: 'Media', severity: 'info' },
      alta: { label: 'Alta', severity: 'warning' },
      urgente: { label: 'Urgente', severity: 'danger' },
    };
    const prioridad = prioridades[rowData.prioridad] || {
      label: rowData.prioridad || 'Media',
      severity: 'info',
    };
    return <Tag value={prioridad.label} severity={prioridad.severity} />;
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
        '¿Está seguro de completar esta ruta? Se creará automáticamente un registro de entrega pendiente para que el conductor marque su estado.',
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
              detail:
                'Ruta completada. La entrega está pendiente de confirmar en el módulo de Entregas.',
              life: 4000,
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

    simularTracking();

    const intervalo = setInterval(() => {
      simularTracking();
    }, 5000);

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

  const cerrarDialogoTracking = () => {
    detenerSimulacionTracking();
    setShowTrackingDialog(false);
  };

  return (
    <div className="p-4">
      <Toast ref={toast} />
      <ConfirmDialog />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Rutas</h1>
          <p className="text-gray-600 text-sm">
            Planifica y gestiona las rutas de entrega
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            label="Nueva Ruta"
            icon="pi pi-plus"
            severity="success"
            onClick={abrirDialogoCrear}
          />
          <Button
            icon="pi pi-refresh"
            outlined
            onClick={cargarRutas}
            tooltip="Actualizar"
          />
        </div>
      </div>

      {/* Tabla de Rutas */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <DataTable
          value={rutas}
          loading={loadingRutas}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          emptyMessage="No hay rutas registradas"
          stripedRows
          responsiveLayout="scroll"
        >
          <Column
            field="numeroRuta"
            header="# Ruta"
            sortable
            style={{ minWidth: '100px' }}
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
            header="Fecha"
            body={fechaTemplate}
            sortable
            style={{ minWidth: '140px' }}
          />
          <Column
            header="Conductor"
            body={conductorRutaTemplate}
            style={{ minWidth: '130px' }}
          />
          <Column
            header="Vehículo"
            body={vehiculoRutaTemplate}
            style={{ minWidth: '130px' }}
          />
          <Column
            header="Prioridad"
            body={prioridadTemplate}
            sortable
            style={{ minWidth: '100px' }}
          />
          <Column
            header="Estado"
            body={estadoRutaTemplate}
            sortable
            style={{ minWidth: '110px' }}
          />
          <Column
            header="Acciones"
            body={accionesRutaTemplate}
            style={{ minWidth: '150px' }}
          />
        </DataTable>
      </div>

      {/* Dialog de Tracking */}
      <Dialog
        header={`Tracking - Ruta ${rutaSeleccionada?.numeroRuta || ''}`}
        visible={showTrackingDialog}
        style={{ width: '700px' }}
        onHide={cerrarDialogoTracking}
        modal
      >
        {rutaSeleccionada && (
          <div className="space-y-4">
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
                  label="Actualizar"
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
                  Simulando movimiento cada 5 segundos...
                </span>
              </div>
            )}

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
                </div>
              )}
            </div>
          </div>
        )}
      </Dialog>

      {/* Dialog para crear ruta - Rediseñado */}
      <Dialog
        header="Crear Nueva Ruta"
        visible={showDialog}
        style={{ width: '800px', maxWidth: '95vw' }}
        onHide={() => setShowDialog(false)}
        modal
        className="p-fluid"
      >
        <div className="flex flex-col gap-4">
          {/* Sección Origen */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <i className="pi pi-warehouse"></i>
              Origen
            </h3>
            <div className="flex flex-col gap-2">
              <label className="font-medium text-gray-700">
                Bodega de Origen *
              </label>
              <Dropdown
                value={formData.bodegaOrigen}
                options={bodegas}
                onChange={(e) =>
                  setFormData({ ...formData, bodegaOrigen: e.value })
                }
                optionLabel="nombre"
                placeholder="Seleccione la bodega de origen"
                filter
                showClear
                emptyMessage="No hay bodegas disponibles"
                className="w-full"
                itemTemplate={(option) => (
                  <div className="flex items-center gap-2">
                    <i className="pi pi-building text-gray-500"></i>
                    <div>
                      <div className="font-medium">{option.nombre}</div>
                      <div className="text-sm text-gray-500">
                        {option.direccion?.ciudad}, {option.direccion?.estado}
                      </div>
                    </div>
                  </div>
                )}
              />
              {formData.bodegaOrigen && (
                <div className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                  <i className="pi pi-map-marker"></i>
                  {formData.bodegaOrigen.direccion?.calle},{' '}
                  {formData.bodegaOrigen.direccion?.ciudad}
                </div>
              )}
            </div>
          </div>

          {/* Sección Destino */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <i className="pi pi-map"></i>
              Destino
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="font-medium text-gray-700">
                  Nombre del Destino *
                </label>
                <InputText
                  value={formData.destino.nombre}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      destino: { ...formData.destino, nombre: e.target.value },
                    })
                  }
                  placeholder="Ej: Cliente ABC"
                  className="w-full"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-medium text-gray-700">Dirección *</label>
                <InputText
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
                  placeholder="Dirección completa"
                  className="w-full"
                />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <label className="font-medium text-gray-700 mb-2 block">
                <i className="pi pi-user mr-1"></i>
                Contacto en Destino (Opcional)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                  placeholder="Nombre"
                  className="w-full"
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
                  className="w-full"
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
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Sección Asignación */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <i className="pi pi-cog"></i>
              Asignación
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="font-medium text-gray-700">
                  <i className="pi pi-car mr-1"></i>
                  Vehículo *
                </label>
                <Dropdown
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
                  className="w-full"
                  itemTemplate={(option) => (
                    <div className="flex items-center gap-2">
                      <i className="pi pi-car text-gray-500"></i>
                      <div>
                        <div className="font-medium">
                          {option.placa} - {option.marca} {option.modelo}
                        </div>
                        <div className="text-sm text-gray-500">
                          Conductor:{' '}
                          {option.conductor_asignado?.nombre || 'N/A'}
                        </div>
                      </div>
                    </div>
                  )}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-medium text-gray-700">
                  <i className="pi pi-calendar mr-1"></i>
                  Fecha *
                </label>
                <Calendar
                  value={formData.fecha_programada}
                  onChange={(e) =>
                    setFormData({ ...formData, fecha_programada: e.value })
                  }
                  showTime
                  hourFormat="24"
                  dateFormat="dd/mm/yy"
                  placeholder="Fecha y hora"
                  showIcon
                  minDate={new Date()}
                  className="w-full"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-medium text-gray-700">
                  <i className="pi pi-flag mr-1"></i>
                  Prioridad
                </label>
                <Dropdown
                  value={formData.prioridad}
                  options={prioridadOptions}
                  onChange={(e) =>
                    setFormData({ ...formData, prioridad: e.value })
                  }
                  className="w-full"
                />
              </div>
            </div>

            {formData.vehiculo && (
              <Message
                severity="info"
                className="mt-3"
                text={`Conductor: ${formData.vehiculo.conductor_asignado?.nombre}`}
              />
            )}

            <div className="mt-4">
              <label className="font-medium text-gray-700 block mb-2">
                Observaciones
              </label>
              <InputTextarea
                value={formData.observaciones}
                onChange={(e) =>
                  setFormData({ ...formData, observaciones: e.target.value })
                }
                rows={2}
                placeholder="Observaciones adicionales..."
                className="w-full"
              />
            </div>
          </div>

          {/* Sección Productos */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <i className="pi pi-box"></i>
              Productos a Transportar
            </h3>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
              <div>
                {productosSeleccionados.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Tag
                      value={`${productosSeleccionados.length} producto(s)`}
                      severity="success"
                    />
                    <span className="text-sm text-gray-500">
                      Total:{' '}
                      {productosSeleccionados.reduce(
                        (sum, p) => sum + (p.cantidadRuta || 1),
                        0,
                      )}{' '}
                      unidades
                    </span>
                  </div>
                ) : (
                  <span className="text-gray-500">
                    No hay productos seleccionados
                  </span>
                )}
              </div>
              <Button
                label="Seleccionar Productos"
                icon="pi pi-plus"
                onClick={abrirDialogoProductos}
                outlined
                size="small"
              />
            </div>

            {productosSeleccionados.length > 0 && (
              <div className="overflow-x-auto">
                <DataTable
                  value={productosSeleccionados}
                  size="small"
                  stripedRows
                  className="text-sm"
                >
                  <Column
                    field="nombre"
                    header="Producto"
                    body={nombreProductoTemplate}
                  />
                  <Column
                    field="categoria"
                    header="Categoría"
                    className="hidden md:table-cell"
                  />
                  <Column
                    header="Cantidad"
                    body={cantidadTemplate}
                    style={{ width: '150px' }}
                  />
                  <Column
                    body={(rowData) => (
                      <Button
                        icon="pi pi-trash"
                        rounded
                        outlined
                        severity="danger"
                        size="small"
                        onClick={() =>
                          setProductosSeleccionados(
                            productosSeleccionados.filter(
                              (p) => p._id !== rowData._id,
                            ),
                          )
                        }
                      />
                    )}
                    style={{ width: '50px' }}
                  />
                </DataTable>
              </div>
            )}
          </div>
        </div>

        {/* Botones del Dialog */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 mt-4 pt-4 border-t border-gray-200">
          <Button
            label="Cancelar"
            icon="pi pi-times"
            outlined
            onClick={() => setShowDialog(false)}
            disabled={loading}
            className="w-full sm:w-auto"
          />
          <Button
            label="Crear Ruta"
            icon="pi pi-check"
            onClick={handleSubmit}
            loading={loading}
            disabled={loading}
            className="w-full sm:w-auto"
          />
        </div>
      </Dialog>

      {/* Dialog para seleccionar productos - Modal separado */}
      <Dialog
        header="Seleccionar Productos a Transportar"
        visible={showProductosDialog}
        style={{ width: '900px', maxWidth: '95vw' }}
        onHide={() => setShowProductosDialog(false)}
        modal
      >
        <Message
          severity="info"
          text="Seleccione los productos que desea incluir en la ruta"
          className="mb-3 w-full"
        />

        <DataTable
          value={productos}
          selection={productosSeleccionados}
          onSelectionChange={(e) => setProductosSeleccionados(e.value)}
          dataKey="_id"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          emptyMessage="No hay productos disponibles"
          loading={loading}
          stripedRows
          selectionMode="checkbox"
          filterDisplay="row"
        >
          <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
          <Column
            field="nombre"
            header="Producto"
            body={nombreProductoTemplate}
            sortable
            filter
            filterPlaceholder="Buscar..."
          />
          <Column field="categoria" header="Categoría" sortable filter />
          <Column
            field="stock_actual"
            header="Stock"
            body={stockTemplate}
            sortable
          />
          <Column field="bodega" header="Bodega" body={bodegaTemplate} />
        </DataTable>

        <div className="flex justify-content-between mt-4">
          <div>
            {productosSeleccionados.length > 0 && (
              <Tag
                value={`${productosSeleccionados.length} producto(s) seleccionado(s)`}
                severity="success"
              />
            )}
          </div>
          <div className="flex gap-2">
            <Button
              label="Cancelar"
              icon="pi pi-times"
              outlined
              onClick={() => setShowProductosDialog(false)}
            />
            <Button
              label="Confirmar Selección"
              icon="pi pi-check"
              onClick={() => setShowProductosDialog(false)}
              disabled={productosSeleccionados.length === 0}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}

export default Rutas;
