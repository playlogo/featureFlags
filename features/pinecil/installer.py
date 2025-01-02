import os
import subprocess
from virtualenv import cli_run


def create_venv(venv_dir):
    """Create a virtual environment if it doesn't exist."""
    if not os.path.exists(venv_dir):
        print(f"Creating virtual environment at {venv_dir}...")
        cli_run([venv_dir])
    else:
        print(f"Virtual environment already exists at {venv_dir}.")


def install_dependencies(venv_dir, requirements):
    """Install dependencies using pip."""
    pip_executable = os.path.join(
        venv_dir, "bin", "pip" if os.name != "nt" else "Scripts\\pip.exe"
    )
    subprocess.check_call([pip_executable, "install", "--upgrade", "pip"])
    subprocess.check_call([pip_executable, "install"] + requirements)


def activate_venv(venv_dir):
    """Activate the virtual environment."""
    activate_script = os.path.join(
        venv_dir,
        "bin",
        "activate_this.py" if os.name != "nt" else "Scripts\\activate_this.py",
    )
    with open(activate_script) as file:
        exec(file.read(), {"__file__": activate_script})


def main():
    # Define virtual environment directory and dependencies
    venv_dir = "venv"
    requirements = ["bleak", "paho-mqtt"]  # Replace with your actual dependencies

    # Step 1: Create and activate virtual environment
    create_venv(venv_dir)
    activate_venv(venv_dir)

    # Step 2: Install required dependencies
    install_dependencies(venv_dir, requirements)

    # Step 3: Run your main script logic
    import main as main

    main.main()


if __name__ == "__main__":
    main()
