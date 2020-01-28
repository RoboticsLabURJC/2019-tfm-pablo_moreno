from django.contrib.auth import login, logout
from django.contrib.auth.forms import AuthenticationForm, UserCreationForm
from django.core.urlresolvers import reverse
from django.shortcuts import render, redirect


#def user_list(request):
#    return render(request, 'chat/user_list.html')


def index(request):
    return render(request, 'chat/index.html', {})


def log_in(request):
    form = AuthenticationForm()
    if request.method == 'POST':
        form = AuthenticationForm(data=request.POST)
        if form.is_valid():
            login(request, form.get_user())
            return redirect(reverse('chat:user_list'))
        else:
            print(form.errors)
    return render(request, 'chat/log_in.html', {'form': form})


def log_out(request):
    logout(request)
    return redirect(reverse('chat:log_in'))


def sign_up(request):
    form = UserCreationForm()
    if request.method == 'POST':
        form = UserCreationForm(data=request.POST)
        if form.is_valid():
            form.save()
            return redirect(reverse('chat:log_in'))
        else:
            print(form.errors)
    return render(request, 'chat/sign_up.html', {'form': form})


def room(request, room_name):
    return render(request, 'chat/room.html', {
        'room_name': room_name
    })


def sharing(request, room_name):
    return render(request, 'chat/share.html', {
        'room_name': room_name
    })
