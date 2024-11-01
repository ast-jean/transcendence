from django import forms
from django.contrib.auth.forms import UserChangeForm, AuthenticationForm, UserCreationForm, PasswordChangeForm
from .models import CustomUser
from django.forms.widgets import ClearableFileInput

class CustomClearableFileInput(ClearableFileInput):
    template_name = 'widgets/file_input.html'

class CustomUserChangeFormPassword(forms.ModelForm):
    old_password = forms.CharField(
        required=False,
        widget=forms.PasswordInput(attrs={'class': 'form-control', 'placeholder': 'Old Password', 'autocomplete': 'off'}),
        label="Old Password"
    )
    new_password1 = forms.CharField(
        required=False,
        widget=forms.PasswordInput(attrs={'class': 'form-control', 'placeholder': 'New Password', 'autocomplete': 'off'}),
        label="New Password"
    )
    new_password2 = forms.CharField(
        required=False,
        widget=forms.PasswordInput(attrs={'class': 'form-control', 'placeholder': 'Confirm New Password', 'autocomplete': 'off'}),
        label="Confirm New Password"
    )

    class Meta:
        model = CustomUser
        fields = []  # No fields from the user model itself; only password fields

    def __init__(self, *args, **kwargs):
        self.user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)

    def clean(self):
        cleaned_data = super().clean()
        old_password = cleaned_data.get("old_password")
        new_password1 = cleaned_data.get("new_password1")
        new_password2 = cleaned_data.get("new_password2")

        # Validate old password only if new password fields are filled
        if new_password1 or new_password2:
            if not old_password:
                self.add_error("old_password", "Please enter your current password to set a new password.")
            if new_password1 != new_password2:
                self.add_error("new_password2", "The new passwords do not match.")
            if old_password and not self.user.check_password(old_password):
                self.add_error("old_password", "The old password is incorrect.")

    def save(self, commit=True):
        new_password1 = self.cleaned_data.get("new_password1")
        if new_password1:
            self.user.set_password(new_password1)
            if commit:
                self.user.save()
        return self.user

class CustomUserChangeForm(forms.ModelForm):
    alias = forms.CharField(
        required=False,
        max_length=150,
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Alias', "autocomplete":"off"})
    )
    avatar = forms.ImageField(required=False, widget=CustomClearableFileInput(attrs={'class': 'form-control-file'}))
    
    class Meta:
        model = CustomUser
        fields = ['alias', 'avatar']

    def __init__(self, *args, **kwargs):
        user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)
        self.user = user
        if user:
            self.fields['alias'].initial = user.alias
            self.fields['avatar'].initial = user.avatar

    def clean(self):
        cleaned_data = super().clean()

    def save(self, commit=True):
        user = super().save(commit=False)
        
        # Update alias and avatar
        user.alias = self.cleaned_data['alias']
        if self.cleaned_data['avatar']:
            user.avatar = self.cleaned_data['avatar']

        if commit:
            user.save()
        return user


class CustomAuthenticationForm(AuthenticationForm):
    username = forms.CharField(
        max_length=254,
        widget=forms.TextInput(attrs={
            'class': 'form-control form-outline form-white',
            'placeholder': 'Username',
            'id': 'id_username', 
            'autofocus': True,
        })
    )
    password = forms.CharField(
        label="Password",
        strip=False,
        widget=forms.PasswordInput(attrs={
            'class': 'form-control form-outline form-white',
            'id': 'id_password', 
            'placeholder': 'Password',
        }),
    )
    
    
class SignUpForm(UserCreationForm):
    email = forms.EmailField(
        required=True,
        widget=forms.EmailInput(attrs={
            'class': 'form-control',
            'id': 'id_email',
            'placeholder': 'name@example.com'
        })
    )
    
    username = forms.CharField(
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'id': 'id_username',
            'placeholder': 'Username'
        })
    )
    password1 = forms.CharField(
        widget=forms.PasswordInput(attrs={
            'class': 'form-control',
            'id': 'id_password1',
            'placeholder': 'Password'
        })
    )
    password2 = forms.CharField(
        widget=forms.PasswordInput(attrs={
            'class': 'form-control',
            'id': 'id_password2',
            'placeholder': 'Confirm Password'
        })
    )

    class Meta:
        model = CustomUser
        fields = ['username', 'email', 'password1', 'password2']