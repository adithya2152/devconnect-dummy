from db import get_devs, get_projects
from fastapi import FastAPI , Depends , Query,status , HTTPException
from fastapi.responses import JSONResponse
from auth.dependencies import get_current_user_id


search_app = FastAPI()

@search_app.get("/devs")
async def search_devs(
    q: str = Query(..., min_length=1),
    user_id: str = Depends(get_current_user_id)
):
    """
    Search developer profiles by name or username.
    Protected route — requires valid access token.
    """
    try:
        filtered_devs = await get_devs(q)
        return JSONResponse(status_code=200, content=filtered_devs or [])

    except Exception as e:
        print(f"❌ Error during /search/devs for user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error while searching developers"
        )
@search_app.get("/projects")
async def search_projects(
    q: str = Query(..., min_length=1),
    user_id: str = Depends(get_current_user_id)
):
    """
    Search projects by name.
    Protected route — requires valid access token.
    """
    try:
        filtered_projects = await get_projects(q)
        return JSONResponse(status_code=200, content=filtered_projects or [])

    except Exception as e:
        print(f"❌ Error during /search/projects for user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error while searching projects"
        )