package com.scaalable.crm.entity;

public enum Role {
    /** Full control: user management, leads, assignments, reports. */
    ADMIN,
    /** Manages leads and assigns leads to agents; views reports. */
    MANAGER,
    /** Works assigned leads: makes calls, sets dispositions, follow-ups. */
    AGENT
}
