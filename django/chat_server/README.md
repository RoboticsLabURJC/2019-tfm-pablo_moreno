# Django channels

## Instalación
### Instalación de Django.
1. Instalar python3.
2. `python3 -m pip install Django`
3. Comprobar instalación: `python3 -m django --version`

### Instalación de Django-Channels.
`sudo pip3 install -U channels`\
Comprobar instalación: `python3 -c 'import channels; print(channels.__version__)'`\

### Ejemplo de Django-Channel (chat).

#### Generación de un prjecto (chat_server).
Para este ejemplo se ha generado un projecto nuevo con el siguiente comando:\
`django-admin startproject chat_server`\

#### Generación de la aplicación (chat).
Para generar una aplicación de Django dentro de un proyecto, basta con ejecutar el siguiente comando;\
`python3 manage.py startapp chat`\

Se añade el proyecto y el Django-Channel a la lista de aplicaciones instaladas en el fichero **chat_server/chat_server/settings.py**:
```
INSTALLED_APPS = [
    'chat',  
    'channels',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]
```

Modificar el fichero **chat_server/chat/routing.py**:  
 ```
from channels.routing import ProtocolTypeRouter

application = ProtocolTypeRouter({  
    # Empty for now (http->django views is added by default)  
})
```
Añadir al fichero **chat_server/chat_server/settings.py** la siguiente instrucción:\
`ASGI_APPLICATION = "routing.application"`
    
Creamos los directorios **templates** y **chat** en el directorio **chat**. 
Creamos y añadimos el fichero **index.html** en el directorio **chat/templates/chat/index.html**:
```<!-- chat/templates/chat/index.html -->
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8"/>
    <title>Chat Rooms</title>
</head>
<body>
    What chat room would you like to enter?<br/>
    <input id="room-name-input" type="text" size="100"/><br/>
    <input id="room-name-submit" type="button" value="Enter"/>

    <script>
        document.querySelector('#room-name-input').focus();
        document.querySelector('#room-name-input').onkeyup = function(e) {
            if (e.keyCode === 13) {  // enter, return
                document.querySelector('#room-name-submit').click();
            }
        };

        document.querySelector('#room-name-submit').onclick = function(e) {
            var roomName = document.querySelector('#room-name-input').value;
            window.location.pathname = '/chat/' + roomName + '/';
        };
    </script>
</body>
</html>
```
Creamos el fichero con la instanciación de las funciones de la web en la ruta **chat/views.py**:
```
# chat/views.py
from django.shortcuts import render

def index(request):
    return render(request, 'chat/index.html', {})
```
En la ruta **chat/urls.py** generamos el fichero con el siguiente código:
```
# chat/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
]
```

Es necesario modificar el fichero **urls.py** del proyecto (**chat_server/chat_server/urls.py**) para redireccionarlo al anterior:
```
# mysite/urls.py
from django.conf.urls import include
from django.urls import path
from django.contrib import admin

urlpatterns = [
    path('chat/', include('chat.urls')),
    path('admin/', admin.site.urls),
]
```

Una vez hechos estos pasos basta con lanzar el servidor con el comando:
`python3 manage.py runserver`

### Aspecto del directorio del proyecto.
```
chat_server/                --> Proyecto
    chat/                   --> Aplicación
        __init__.py
        admin.py            --> Eliminado
        apps.py             --> Eliminado
        migrations/         --> Eliminado
            __init__.py     --> Eliminado
        models.py           --> Eliminado
        tests.py            --> Eliminado
        views.py            --> *Modificado*
        urls.py             --> *Modificado*
        views.py            --> *Modificado*
    chat_server/
        __init__.py
        asgi.py
        settings.py         --> *Modificado*
        urls.py             --> *Modificado*
        wsgi.py
    __init__.py
    db.sqlite3
    manage.py
    routing.py              --> *Modificado*
```