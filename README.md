# smart_plant_pot

# To run this project:
- Create artefact registry repository
- Create cloud compute engine
- Install docker on your cloud compute engine
- Replace all necessary values in dockerfiles (/bh-admin-panel/Dockerfile, DeviceServer/Dockerfile, User_Server_BH_basic/Dockerfile)
- Replace all necessary values in cloudbuilds (/cloudbuild.yaml, bh-admin-panel/cloudbuild.yaml)
- Add github trigger for each cloudbuild
- Deploy commit
