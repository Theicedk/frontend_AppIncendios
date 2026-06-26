import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Button, Image } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/icon-symbol';
import * as WebBrowser from 'expo-web-browser';
//Import general de expo para llegar hacia un inicio de sesión (en nuestro caso auth0)
import * as AuthSession from 'expo-auth-session';
//Desencriptador de JWT para poder leer los scopes del token y dar acceso al usuario
import { jwtDecode } from 'jwt-decode';
import * as SecureStore from 'expo-secure-store';
import { useFocusEffect } from 'expo-router';


//funcion que verifica que una vez que se termine de verificar con auth0 se cierre la ventana
WebBrowser.maybeCompleteAuthSession();

//Coordenadas de Auth0 para la autenticación
const discovery = {
  //URL donde el usuario se autentificará
  authorizationEndpoint: 'https://dev-ecmx143cjy36oshj.us.auth0.com/authorize',
  //URL donde se intercambiará el código por el token
  tokenEndpoint: 'https://dev-ecmx143cjy36oshj.us.auth0.com/oauth/token',};

//Boton de login 
export default function LoginScreen() {
  //1.- Configuracion de la ruta de regreso para expo sin utilizar el proxy
  const redirectUri = AuthSession.makeRedirectUri({scheme: 'valledelsol'});
  //2.- Configuración de Auth0
  const[request, result, promptAsync] = AuthSession.useAuthRequest({
    clientId: 'JDRWSan8BqKkpWlGH5IutSE4ZXnyllNF',
    scopes: ['openid', 'profile', 'email'],
    redirectUri: redirectUri,
    extraParams: {audience: 'https://api-app-incendios-auth0/',}
  }, discovery);

  //Creamos una variable de estado la cual cambiará una vez el usuario ingrese
  const [user, setUser] = useState<any>(null);
  //Variable de estado para guardar los permisos del usuario
  const [permisos, setPermisos] = useState<string[]>([]);

  const [cargando, setCargando] = useState<boolean>(true);

  //Creamos una funcion para que una vez se tenga el token del usuario, se haga un fetch
  //hacia un endpoint de auth0 para que este nos devuelva los datos del usuario
  const fetchUserInfo = async (token: string) => {
    try{
      //Aqui mandamos nuestro token hacia el endpoint
      const response = await fetch('https://dev-ecmx143cjy36oshj.us.auth0.com/userinfo', {
        headers: {
          Authorization: `Bearer ${token}`,// Nuestro token siendo enviado
        },
      });
      
      //Esperamos la respuesta de el  fetch y luego guardamos los datos del usuario en el estado
      const userInfo = await response.json();
      setUser(userInfo);
      await SecureStore.setItemAsync('perfil_usuario', JSON.stringify(userInfo)); 
      //Para luego mostrar en consola los datos del usuario
      console.log('Información del usuario recibida con exito :', userInfo);
    }catch(error){
      console.error('Error al obtener la información del usuario:', error);
    }
  }

  //2.- Escuchamos al usuario cuando vuelva de la autenticación
  useEffect(() => {
    
    console.log('Redirigido a la siguiente URL: ', redirectUri);

    if (result?.type === 'error' || result?.type === 'dismiss') {
    // 👇 Solo pasamos la variable 'result' completa
    console.error('Auth0 rechazó la petición. Detalle:', result);
    return;
  }
    //Verifica si el resultado de la autenticación es exitoso
    if(result?.type === 'success'){

      //Guardamos el resultado en una variable
      const { code } = result.params;

      //Generamos una peticion para obtener el token a partir de nuestros datos y resultados
      AuthSession.exchangeCodeAsync({
        clientId: 'JDRWSan8BqKkpWlGH5IutSE4ZXnyllNF',
        code: code,
        redirectUri: redirectUri,
        extraParams: {
          code_verifier: request?.codeVerifier || '',
        },
      }, discovery)
      //Una vez enviado los datos y obteniendo el token lo mostraremos en consola
      .then(async (tokenResult) => {
        console.log('Token de acceso obtenido:', tokenResult?.accessToken);
        //Si se obtiene el token, se llama a la función para obtener la información del usuario
        if(tokenResult?.accessToken){
          fetchUserInfo(tokenResult.accessToken);
          try {
            //Decodificamos el token para obtener los permisos del usuario
            const TokenDecodificado= jwtDecode(tokenResult.accessToken) as any;
            //Guardamos los permisos en el estado
            setPermisos(TokenDecodificado.permissions || []);
            console.log('Permisos del usuario:', TokenDecodificado.permissions);
            await SecureStore.setItemAsync('access_token', tokenResult.accessToken);
            await SecureStore.setItemAsync('permisos_usuario', JSON.stringify(TokenDecodificado.permissions || []));
          } catch (error) {
            console.error('Error al decodificar el token:', error);
          }
        }
      })
      //Y sino se muestra el error en consola
      .catch((error) => {
        console.error('Error al intercambiar el código por el token:', error);
      });
    }
  }, [result,redirectUri,request]);

useFocusEffect(
    useCallback(() => {
      const recuperarUsuarioDeBoveda = async () => {
        try {
          const perfilGuardado = await SecureStore.getItemAsync('perfil_usuario');
          
          if (perfilGuardado) {
            // 🪙 Si el token existe, lo decodificamos para recuperar el nombre, correo, etc.
            const datosUsuario = JSON.parse(perfilGuardado);
            setUser(datosUsuario);
          } else {
            // Si no hay token, nos aseguramos de que el estado quede limpio
            setUser(null);
          }
        } catch (error) {
          console.error("Error al recuperar datos del usuario:", error);
          setUser(null);
        } finally {
          setCargando(false);
        }
      };

      recuperarUsuarioDeBoveda();
    }, [])
    
  );





  const handleLogin = () => {
    console.log('Iniciar Sesión apretado');
    promptAsync();
  };








// Boton de logout
  const handleLogout = async () => {
    console.log('Cerrar Sesión apretado');
    try {
      await SecureStore.deleteItemAsync('permisos_usuario');
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('perfil_usuario');
    } catch (error) {
      console.error('Error al borrar', error);
    } 
    
    setUser(null); // Limpiamos los datos del usuario
  };








  //Boton para probar la conexión al backend
  const handleTestBackend = async () => {
    console.log('Probar Conexión al Backend apretado');
    try {
      const response = await fetch('http://192.168.1.19:8080/api/reportes');
      
      console.log('Código de respuesta del servidor:', response.status);
      
      if (response.status === 401) {
        console.log('Conexión al Backend exitosa, pero no autenticado (401 Unauthorized)');
      } else {
        console.log('El servidor respondio inesperadamente con status:', response.status);
      }
    } catch (error) {
      console.log('Error al conectar con el Backend:', error);
    }

  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        {/*Se realiza la consulta para verificar si se encuentra un usuario autenticado*/}
        {user ? (
          //Primero en el caso de que nuestra variable donde manejamos al usuario
          //SI tenga datos
          <View style={styles.profileContainer}>
            {/*Primero extraeremos la foto de perfil del usuario en auth0, y la mostraremos*/}
            {user.picture && (
              <Image source={{ uri: user.picture }} style={styles.avatar} />
            )}

            <Text style= {styles.welcomeText}>Bienvenido, {user.name}!</Text>
            <Text style={styles.emailText}>{user.email}</Text>

          <TouchableOpacity style={styles.testButton} onPress={handleTestBackend}>
            <IconSymbol size={24} name="network" color="#fff" />
            <Text style={styles.testButtonText}>Probar Conexión al Backend</Text>
          </TouchableOpacity>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
            </TouchableOpacity>
          </View>):(
           //En el caso de que no se encuentre un usuario autenticado, se mostrará el siguiente mensaje
          <View style={styles.loginContainer}>
            <Text style={styles.title}>No se encontró ningún usuario autenticado.</Text>
            <Text style={styles.subtitle}>Para aprovechar las funciones al máximo, por favor inicie sesión.</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
            <Text style={styles.primaryButtonText}>Ingresar con Auth0</Text>
          </TouchableOpacity>
          </View>)
          }
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 16,
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    marginBottom: 24,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  buttonContainer: {
    gap: 16,
  },
  primaryButton: {
    backgroundColor: Colors.light.tint,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.light.tint,
    gap: 8,
  },
  secondaryButtonText: {
    color: Colors.light.tint,
    fontSize: 16,
    fontWeight: '600',
  },
  testButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 16,
    width: '80%',
    gap: 8,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  profileContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    width: '100%',
  },
  loginContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60, // Esto hace que la imagen sea un círculo perfecto
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#007BFF', // Un borde azul bonito
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    textAlign: 'center',
  },
  emailText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: '#FF3B30', // Botón rojo para salir
    padding: 16,
    borderRadius: 12,
    width: '80%',
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
