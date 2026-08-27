import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import AnimatedPage from "../components/ui/AnimatedPage.jsx";
import AddTodo from "../components/todos/AddTodo.jsx";
import TodoBoard from "../components/todos/TodoBoard.jsx";
import { fetchInviteUserData } from "../features/workplaces/workplacesSlice.js";
import AvatarInviteUsers from "../components/AvatarInviteUsers.jsx";
import { clearBoardError, fetchBoard } from "../features/todos/todosSlice.js";
import {
  ArrowAngularDownLeft,
  ChevronLeft,
  TurnDownLeft,
  UserMultiple1,
} from "@tailgrids/icons";
export default function TodoManager() {
  const { workspaceId } = useParams(),
    dispatch = useDispatch(),
    { workspace, items, fetchStatus, error } = useSelector((s) => s.todos);
  const { InvitedUsers } = useSelector((state) => state.workplaces);
  useEffect(() => {
    dispatch(fetchBoard(workspaceId));
  }, [dispatch, workspaceId]);
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearBoardError());
    }
  }, [dispatch, error]);
  useEffect(() => {
    dispatch(fetchInviteUserData(workspaceId));
  }, []);
  if (fetchStatus === "loading" && !workspace)
    return (
      <div className='board-loading'>
        <span className='button-loader' />
        <p>Loading your board…</p>
      </div>
    );
  if (fetchStatus === "failed" && !workspace)
    return (
      <div className='empty-modern large glass'>
        <span>!</span>
        <strong>Board unavailable</strong>
        <p>We could not load this workspace.</p>
        <Link className='button button-primary' to='/workspaces'>
          Back to workspaces
        </Link>
      </div>
    );
  return (
    <AnimatedPage className='page-stack board-page'>
      <section className='page-header modern board-header block!'>
        <div className='w-full flex justify-between'>
          <span className='eyebrow'>Todo manager</span>
          <div>
            <Link className='back-link items-end' to='/workspaces'>
              <TurnDownLeft /> return
            </Link>
          </div>
        </div>
        <div className='page-header modern board-header'>
          <div>
            <h1>{workspace?.title || "Workspace board"}</h1>
            <p>
              {workspace?.description ||
                "Plan work and move tickets between todo columns."}
            </p>
          </div>
          <AddTodo workspaceId={Number(workspaceId)} />
        </div>
        {InvitedUsers.length > 0 && (
          <div className='flex justify-between border-b-1 border-gray-4 border-dashed pb-2'>
            <div></div>
            <div></div>
            <div className='border rounded-2xl flex sample-color p-1'>
              <div className='mr-3 invite-user'>
                <UserMultiple1 />
              </div>
              {InvitedUsers.map((item, key) => (
                <div className='-ml-2 content-center'>
                  <AvatarInviteUsers user={item} size={24} key={key} />
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
      {!items.length ? (
        <div className='empty-modern large glass'>
          <span>＋</span>
          <strong>Create your first todo column</strong>
          <p>Todo columns hold tickets and support drag-and-drop ordering.</p>
        </div>
      ) : (
        <TodoBoard workspaceId={Number(workspaceId)} />
      )}
    </AnimatedPage>
  );
}
