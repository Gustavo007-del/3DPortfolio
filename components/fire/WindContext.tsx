"use client";

import {
  createContext,
  useContext,
} from "react";

import { useFrame } from "@react-three/fiber";

import { useRef } from "react";

type WindState={
    strength:number;
    direction:number;
    gust:number;
    vector:[number,number];
};

const WindContext=createContext<WindState>({
    strength:0,
    direction:0,
    gust:0,
    vector:[1,0],
});

export function WindProvider({

    children,

}:{

    children:React.ReactNode;

}){

    const wind=useRef<WindState>({
    strength:.45,
    direction:0,
    gust:0,
    vector:[.45,0],
});

    useFrame((state)=>{

        const t=state.clock.elapsedTime;

        wind.current.direction=

            Math.sin(t*.05)*Math.PI;

        wind.current.strength=

            .45+

            Math.sin(t*.18)*.15;

        const s=
    wind.current.strength+
    wind.current.gust*.4;

wind.current.vector[0]=
    Math.cos(wind.current.direction)*s;

wind.current.vector[1]=
    Math.sin(wind.current.direction)*s;

    });

    return(

        <WindContext.Provider

            value={wind.current}

        >

            {children}

        </WindContext.Provider>

    );

}

export function useWind(){

    return useContext(WindContext);

}