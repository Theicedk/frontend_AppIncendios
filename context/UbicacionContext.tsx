import React, { createContext, useState, ReactNode } from 'react';

type UbicacionContextType = {
  latitud: number | null;
  longitud: number | null;
  setUbicacion: (lat: number, lng: number) => void;
};

export const UbicacionContext = createContext<UbicacionContextType | undefined>(undefined);

export const UbicacionProvider = ({ children }: { children: ReactNode }) => {
  const [latitud, setLatitud] = useState<number | null>(null);
  const [longitud, setLongitud] = useState<number | null>(null);

  const setUbicacion = (lat: number, lng: number) => {
    setLatitud(lat);
    setLongitud(lng);
  };

  return (
    <UbicacionContext.Provider value={{ latitud, longitud, setUbicacion }}>
      {children}
    </UbicacionContext.Provider>
  );
};
