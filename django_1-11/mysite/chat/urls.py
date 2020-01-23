from django.conf.urls import url
#from chat.views import log_in, log_out, sign_up, user_list, sharing, room
from . import views


urlpatterns = [
    url(r'^log_in/$', views.log_in, name='log_in'),
    url(r'^log_out/$', views.log_out, name='log_out'),
    url(r'^sign_up/$', views.sign_up, name='sign_up'),
    url(r'^share/(.+)/$', views.sharing, name='sharing'),
    url(r'^chat/(.+)/', views.room, name='room'),
    url(r'^chat/', views.index, name='index'),
    #url(r'^$', views.user_list, name='user_list')
]
