import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ca } from 'date-fns/locale';
import { Calendar, Stethoscope, Heart, Syringe, Phone, ChevronLeft, ChevronRight, Pill } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { TandaSelector } from '@/components/TandaSelector';
import { ConsultaForm } from '@/components/ConsultaForm';
import { MobileConsultaSelector } from '@/components/MobileConsultaSelector';
import { CancelBookingSection } from '@/components/CancelBookingSection';
import { ReceptaForm } from '@/components/ReceptaForm';
import { useDiesVisita, useCitesDia } from '@/hooks/useDiesVisita';
import { useIsMobile } from '@/hooks/use-mobile';
import { DiaVisita } from '@/lib/types';

function DiaVisitaCard({ dia, isSelected, onSelect }: { dia: DiaVisita; isSelected: boolean; onSelect: () => void }) {
  const dataFormatada = format(new Date(dia.data), "EEE d", { locale: ca });
  const mesFormatat = format(new Date(dia.data), "MMM", { locale: ca });
  
  const isAvui = dia.data === format(new Date(), 'yyyy-MM-dd');

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={`
        flex flex-col items-center justify-center p-2 sm:p-3 rounded-lg sm:rounded-xl border-2 min-w-[65px] sm:min-w-[80px] transition-all
        ${isSelected 
          ? 'border-primary bg-primary/10 text-primary' 
          : 'border-border hover:border-primary/50'
        }
        ${isAvui ? 'ring-2 ring-primary ring-offset-1 sm:ring-offset-2' : ''}
      `}
    >
      <span className="text-[10px] sm:text-xs text-muted-foreground uppercase">{mesFormatat}</span>
      <span className="text-sm sm:text-lg font-bold capitalize">{dataFormatada}</span>
      {isAvui && <span className="text-[9px] sm:text-[10px] font-medium text-primary">Avui</span>}
      <div className="flex gap-0.5 sm:gap-1 mt-0.5 sm:mt-1">
        {dia.metge_actiu && <Stethoscope className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-muted-foreground" />}
        {dia.infermera_activa && <Heart className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-muted-foreground" />}
      </div>
    </motion.button>
  );
}

const Index = () => {
  const { data: diesVisita = [], isLoading: loadingDies } = useDiesVisita();
  const [selectedDiaIndex, setSelectedDiaIndex] = useState(0);
  const isMobile = useIsMobile();
  
  const selectedDia = diesVisita[selectedDiaIndex];
  const { data: cites = [] } = useCitesDia(selectedDia?.id);

  const avui = format(new Date(), "EEEE, d MMMM yyyy", { locale: ca });

  if (loadingDies) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregant...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-1 sm:mb-2">
              Consultori de l'Albagés
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground flex items-center justify-center gap-1.5 sm:gap-2">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="capitalize">{avui}</span>
            </p>
          </motion.div>
        </div>
      </header>

      {/* Enllaç a pantalla de números */}
      <div className="container mx-auto px-3 sm:px-4 pt-4 sm:pt-6 max-w-4xl">
        <Link to="/pantalla">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-center gap-2 sm:gap-3 p-3 sm:p-4 bg-primary/10 hover:bg-primary/20 border-2 border-primary/30 rounded-xl cursor-pointer transition-all"
          >
            <Stethoscope className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
            <span className="text-sm sm:text-lg font-semibold text-primary text-center">
              Veure per quin número estan visitant
            </span>
          </motion.div>
        </Link>
      </div>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-4xl">
        {diesVisita.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="text-center py-8 sm:py-12">
              <CardContent>
                <Calendar className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                <h2 className="text-xl sm:text-2xl font-semibold mb-2">No hi ha visites programades</h2>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Torna més tard o contacta amb el centre de salut.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <>
            {/* Selector de dies */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 sm:mb-6"
            >
              <h2 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                Selecciona el dia
              </h2>
              <div className="flex items-center gap-1 sm:gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0"
                  onClick={() => setSelectedDiaIndex(Math.max(0, selectedDiaIndex - 1))}
                  disabled={selectedDiaIndex === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                <div className="flex-1 overflow-x-auto scrollbar-hide">
                  <div className="flex gap-1.5 sm:gap-2 pb-1">
                    {diesVisita.map((dia, index) => (
                      <DiaVisitaCard
                        key={dia.id}
                        dia={dia}
                        isSelected={index === selectedDiaIndex}
                        onSelect={() => setSelectedDiaIndex(index)}
                      />
                    ))}
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0"
                  onClick={() => setSelectedDiaIndex(Math.min(diesVisita.length - 1, selectedDiaIndex + 1))}
                  disabled={selectedDiaIndex === diesVisita.length - 1}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>

            {selectedDia && (
              <Tabs defaultValue="cites" className="space-y-4 sm:space-y-6">
                <TabsList className="grid w-full grid-cols-3 h-11 sm:h-12">
                  <TabsTrigger value="cites" className="text-xs sm:text-base gap-1 sm:gap-2 px-1 sm:px-3">
                    <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>Cita</span>
                  </TabsTrigger>
                  <TabsTrigger value="consulta" className="text-xs sm:text-base gap-1 sm:gap-2 px-1 sm:px-3">
                    <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>Consulta</span>
                  </TabsTrigger>
                  <TabsTrigger value="receptes" className="text-xs sm:text-base gap-1 sm:gap-2 px-1 sm:px-3">
                    <Pill className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>Receptes</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="cites" className="space-y-4 sm:space-y-6">
                  {/* Data seleccionada */}
                  <div className="text-center py-2 px-3 sm:px-4 bg-accent/50 rounded-lg">
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Reservant per al{' '}
                      <span className="font-semibold text-foreground capitalize">
                        {format(new Date(selectedDia.data), "EEEE, d 'de' MMMM", { locale: ca })}
                      </span>
                    </p>
                  </div>

                  <motion.div
                    key={selectedDia.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid gap-6 md:grid-cols-2"
                  >
                    {/* Metge */}
                    {selectedDia.metge_actiu && (
                      <Card>
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center gap-2 text-primary">
                            <Stethoscope className="w-5 h-5" />
                            Metge
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <TandaSelector
                            tipus="metge"
                            maxTandes={selectedDia.max_tandes_metge}
                            citesOcupades={cites}
                            diaVisitaId={selectedDia.id}
                            titol="Selecciona el teu número"
                            dataVisita={selectedDia.data}
                          />
                        </CardContent>
                      </Card>
                    )}

                    {/* Infermera */}
                    {selectedDia.infermera_activa && (
                      <Card>
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center gap-2 text-primary">
                            <Heart className="w-5 h-5" />
                            Infermera
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <TandaSelector
                            tipus="infermera"
                            maxTandes={selectedDia.max_tandes_infermera}
                            citesOcupades={cites}
                            diaVisitaId={selectedDia.id}
                            titol="Selecciona el teu número"
                            dataVisita={selectedDia.data}
                          />
                        </CardContent>
                      </Card>
                    )}
                  </motion.div>

                  {/* Vacunes */}
                  {(selectedDia.vacunes_grip_actiu || selectedDia.vacunes_covid_actiu) && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="grid gap-6 md:grid-cols-2"
                    >
                      {selectedDia.vacunes_grip_actiu && (
                        <Card className="border-warning/30 bg-warning/5">
                          <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2 text-warning">
                              <Syringe className="w-5 h-5" />
                              Vacuna Grip
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <TandaSelector
                              tipus="grip"
                              maxTandes={selectedDia.max_tandes_grip}
                              citesOcupades={cites}
                              diaVisitaId={selectedDia.id}
                              titol="Selecciona el teu número"
                              dataVisita={selectedDia.data}
                            />
                          </CardContent>
                        </Card>
                      )}

                      {selectedDia.vacunes_covid_actiu && (
                        <Card className="border-primary/30 bg-primary/5">
                          <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2 text-primary">
                              <Syringe className="w-5 h-5" />
                              Vacuna COVID
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <TandaSelector
                              tipus="covid"
                              maxTandes={selectedDia.max_tandes_covid}
                              citesOcupades={cites}
                              diaVisitaId={selectedDia.id}
                              titol="Selecciona el teu número"
                              dataVisita={selectedDia.data}
                            />
                          </CardContent>
                        </Card>
                      )}
                    </motion.div>
                  )}

                  {/* Secció de cancel·lació */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <CancelBookingSection />
                  </motion.div>

                  {/* Missatge si no hi ha serveis actius */}
                  {!selectedDia.metge_actiu && !selectedDia.infermera_activa && !selectedDia.vacunes_grip_actiu && !selectedDia.vacunes_covid_actiu && (
                    <Card className="text-center py-8">
                      <CardContent>
                        <p className="text-muted-foreground">
                          No hi ha serveis actius per a aquest dia.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="consulta" className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {isMobile ? (
                      <MobileConsultaSelector />
                    ) : (
                      <div className="grid gap-6 md:grid-cols-2">
                        <ConsultaForm tipus="metge" />
                        <ConsultaForm tipus="infermera" />
                      </div>
                    )}
                  </motion.div>
                </TabsContent>

                <TabsContent value="receptes" className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-md mx-auto"
                  >
                    <ReceptaForm />
                  </motion.div>
                </TabsContent>
              </Tabs>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-card mt-auto">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 text-center text-xs sm:text-sm text-muted-foreground">
          Consultori de l'Albagés
        </div>
      </footer>

    </div>
  );
};

export default Index;
