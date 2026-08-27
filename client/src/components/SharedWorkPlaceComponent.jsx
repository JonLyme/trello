import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, UserMultiple4 } from "@tailgrids/icons";
import { fetchSharedWorkplaces } from "../features/workplaces/workplacesSlice.js";
import AvatarImage from "./AvatarImage.jsx";

const API_ORIGIN = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/api\/?$/, "");
const FALLBACK_IMAGE = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="560"><defs><linearGradient id="g" x1="0" x2="1"><stop stop-color="#4f46e5"/><stop offset="1" stop-color="#14b8a6"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><text x="50%" y="52%" text-anchor="middle" dominant-baseline="middle" fill="white" font-family="Arial" font-size="42">Shared workspace</text></svg>',
)}`;

export default function SharedWorkPlaceComponent() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { sharedItems } = useSelector((state) => state.workplaces);
  useEffect(() => {
    dispatch(fetchSharedWorkplaces());
  }, [dispatch]);

  return (
    <section className='shared-workspaces-section'>
      <div className='shared-section-heading'>
        <div>
          <span className='eyebrow'>Collaboration</span>
          <h2>Shared with you</h2>
          <p>Workspaces where another user gave you editor access.</p>
        </div>
        <span className='shared-count'>
          <UserMultiple4 /> {sharedItems.length}
        </span>
      </div>
      {/*       
        {sharedFetchStatus === "loading" && !sharedItems.length && (
          <div className='shared-workspace-grid'>
            {[1, 2].map((item) => (
              <div className='shared-workspace-card skeleton-card' key={item}>
                <div className='skeleton skeleton-cover' />
              </div>
            ))}
          </div>
        )}

        {sharedFetchStatus === "failed" && !sharedItems.length && (
          <div className='empty-modern shared-empty glass' role='alert'>
            <span>!</span>
            <strong>Shared workspaces are unavailable</strong>
            <p>{sharedError || "Please try again."}</p> 
            <button
              type='button'
              className='button button-ghost'
              onClick={() => dispatch(fetchSharedWorkplaces())}
            >
              Retry
            </button>
          </div>
        )}

        {sharedFetchStatus !== "loading" &&
          !sharedItems.length &&
          sharedFetchStatus !== "failed" && (
            <div className='empty-modern shared-empty glass'>
              <span>↗</span>
              <strong>No shared workspaces yet</strong>
              <p>
                When another user invites you, the workspace will appear here.
              </p>
            </div>
          )} */}

      {!!sharedItems.length && (
        <div className='shared-workspace-grid'>
          {sharedItems.map((item) => (
            <motion.article
              key={item.id}
              className='shared-workspace-card'
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -3 }}
            >
              <button
                type='button'
                className='shared-workspace-open'
                onClick={() => navigate(`/workspaces/${item.id}/todos`)}
              >
                <div className='shared-workspace-image'>
                  <img
                    src={
                      item.image_url
                        ? `${API_ORIGIN}${item.image_url}`
                        : FALLBACK_IMAGE
                    }
                    alt={`${item.title} workspace cover`}
                  />
                  <span className='shared-editor-badge'>Editor</span>
                </div>
                <div className='shared-workspace-copy'>
                  <span className='workspace-card-label'>Shared workspace</span>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <span className='shared-open-label'>
                    Open board <ChevronRight />
                  </span>
                </div>
              </button>
              <div className='shared-by-row'>
                <AvatarImage user={item.invitedBy} size={34} />
                <div>
                  <span>Invited by</span>
                  <strong>
                    {item.invitedBy?.name || item.invitedBy?.email}
                  </strong>
                  <small>{item.invitedBy?.email}</small>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </section>
  );
}
