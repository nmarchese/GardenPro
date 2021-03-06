package data;

import java.time.LocalDate;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import entities.Plant;
import entities.Planting;
import entities.Reminder;
import entities.User;

@Transactional
@Repository
public class PlantingDAOImpl implements PlantingDAO {
	@PersistenceContext
	private EntityManager em;

	@Autowired
	ReminderDAO rdao;

	@Override
	public Collection<Planting> index() {
		String q = "select t from Planting t";
		List<Planting> plantings = em.createQuery(q, Planting.class).getResultList();
		return plantings;
	}

	@Override
	public Collection<Planting> index(int userId) {
		System.out.println("User id in index: " + userId);
		User u = em.find(User.class, userId);
		System.out.println(u);
		return u.getPlantings();
	}

	@Override
	public Planting show(int id) {

		return em.find(Planting.class, id);
	}

	@Override
	public Planting update(int id, Planting planting) {
		System.out.println("planting id to change = " + id);

		Planting oldPlanting = em.find(Planting.class,id);
		Plant plant = em.find(Plant.class, planting.getPlant().getId());
		oldPlanting.setQty(planting.getQty());

		int startStage = oldPlanting.getStage();
		int newStage = planting.getStage();
		oldPlanting.setStage(newStage);

		try {
			if (startStage != newStage){
				switch(newStage){
				case 1: 
						oldPlanting.setStarted(LocalDate.now());
						clearReminder(oldPlanting, 1);
						rdao.create(oldPlanting, "germinate");
						rdao.create(oldPlanting, "indoors");
						rdao.create(oldPlanting, "water");
						break;
				case 2:
						break;

				case 3:
					rdao.create(oldPlanting, "outdoors");
					rdao.create(oldPlanting, "water");
					
						break;

				case 4: 
					oldPlanting.setPlanted(LocalDate.now());
					if(plant.isHarvestable()){
						rdao.create(oldPlanting, "harvest");
						oldPlanting.setHarvest(oldPlanting.getStarted().plusWeeks(-plant.getEndGerm()).plusWeeks(plant.getTimeToHarvest()));
					}
					rdao.create(oldPlanting, "water");
					clearReminder(oldPlanting, 1,2,3,4);		
						break;

				case 5: 
					rdao.create(oldPlanting, "harvest");
					rdao.create(oldPlanting, "water");
						break;

			}

			}
		} catch (Exception e) {
			System.out.println("//////////planting update failed.//////////");
			e.printStackTrace();
		}

		em.persist(oldPlanting);
		em.flush();
		return oldPlanting;
	}

	private void clearReminder(Planting planting, int... stages) {
		Set<Reminder> reminders = planting.getReminders();
		if (reminders != null && reminders.size() > 0) {
			for (Reminder r : reminders) {
				if (stages != null && stages.length > 0) {
					for (int s : stages) {
						if (r.getCategory() == s) {
							r.setComplete(true);
						}
					}
				}

			} 
		}

	}

	/* (non-Javadoc)
	 * @see data.PlantingDAO#create(entities.Planting, int, int)
	 */
	@Override
	public Planting create(Planting planting, int userId, int plantId) {
		User u = em.find(User.class, userId);
		planting.setUser(u);
		Plant p = em.find(Plant.class, plantId);
		planting.setPlant(p);

		em.persist(planting);

		em.flush();
		switch (planting.getStage()) {
		case 0:
			rdao.create(planting, "start");
			break;
		case 1: 
			planting.setStarted(LocalDate.now());
			rdao.create(planting, "germinate");
			rdao.create(planting, "indoors");
			break;
		case 4:
			planting.setStarted(LocalDate.now());
			rdao.create(planting, "water");
			if(p.isHarvestable()){
				rdao.create(planting, "harvest");
			}
			break;
		case 5:
			planting.setStarted(LocalDate.now());
			rdao.create(planting, "water");
			if(p.isHarvestable()){
				rdao.create(planting, "harvest");
			}
		}
		return em.find(Planting.class, planting.getId());
	}

	@Override
	public Planting destroy(int id) {
		Planting planting = em.find(Planting.class, id);
		planting.getUser().getPlantings().remove(planting);
		em.remove(planting);
		return planting;
	}

	@Override
	public Set<Planting> updatePlantingsStatus(User user) {
		LocalDate now = LocalDate.now();

		for (Planting p : user.getPlantings()) {
			int s = p.getStage();
			int sproutDate = p.getPlant().getWeeksBeforeLastFrost() - p.getPlant().getEndGerm();

			if (s > 0) {
				if (p.getStarted() != null && p.getStarted().minusWeeks(Math.round(sproutDate / 2)).isBefore(now)
						&& now.isBefore(p.getStarted().minusWeeks(sproutDate))) {
					p.setStage(2);
				} else if (p.getStarted() != null && p.getStarted().minusWeeks(sproutDate).isBefore(now)
						&& now.isBefore(p.getUser().getFrostDate())) {
					p.setStage(3);
				} else if (s == 4 && p.getPlanted() != null && p.getPlanted().plusWeeks(6).isBefore(now)) {
					p.setStage(5);
				}
			}
			update(p.getId(), p);
		}
		return null;
	}
}
